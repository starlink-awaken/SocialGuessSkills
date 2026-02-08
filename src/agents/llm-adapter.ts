import type { AgentOutput, AgentType } from "../types";
import type { CallAnthropicResult } from "./llm-client";
import { callAnthropic } from "./llm-client.js";
import { retryWithBackoff } from "../utils/retry.js";
import { config } from "../utils/config.js";
import { generateMockOutput } from "./mock-outputs.js";

export interface LLMAdapter {
  name: "mock" | "anthropic";
  generate: (agentType: AgentType, prompt: string) => Promise<AgentOutput>;
}

const SECTION_LABELS = {
  "结论": "conclusion",
  "依据": "evidence",
  "风险": "risks",
  "建议": "suggestions",
  "可证伪点": "falsifiable"
} as const;

type SectionKey = typeof SECTION_LABELS[keyof typeof SECTION_LABELS];

type ParsedSections = Record<SectionKey, string[]>;

let forceMock = false;
let anthropicAvailability: Promise<boolean> | null = null;

export async function getLLMAdapter(): Promise<LLMAdapter> {
  const provider = config.LLM_PROVIDER;

  if (provider === "mock" || shouldUseMock()) {
    return mockAdapter;
  }

  if (provider === "anthropic") {
    if (!config.ANTHROPIC_API_KEY) {
      throw new Error("LLM_PROVIDER is set to anthropic but ANTHROPIC_API_KEY is missing");
    }
    return anthropicAdapter;
  }

  if (await canUseAnthropic()) {
    return anthropicAdapter;
  }

  return mockAdapter;
}

function shouldUseMock(): boolean {
  if (forceMock) {
    return true;
  }
  if (config.AGENT_MOCK_MODE) {
    return true;
  }
  return !config.ANTHROPIC_API_KEY;
}

async function canUseAnthropic(): Promise<boolean> {
  if (shouldUseMock()) {
    return false;
  }
  if (!anthropicAvailability) {
    anthropicAvailability = (async () => {
      try {
        await callAnthropic("ping", { maxTokens: 8, timeout: 2000 });
        return true;
      } catch (error) {
        if (isInvalidApiKeyError(error)) {
          forceMock = true;
        }
        return false;
      }
    })();
  }
  return anthropicAvailability;
}

function isInvalidApiKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("api key") && (message.includes("invalid") || message.includes("expired"));
}

function firstNonEmpty(lines: string[]): string | null {
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function extractSections(content: string): ParsedSections {
  const sections: ParsedSections = {
    conclusion: [],
    evidence: [],
    risks: [],
    suggestions: [],
    falsifiable: []
  };
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  let current: SectionKey | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const headerMatch = line.match(/^\*{0,2}(结论|依据|风险|建议|可证伪点)\*{0,2}\s*[:：]?\s*(.*)$/);
    if (headerMatch) {
      const label = headerMatch[1] as keyof typeof SECTION_LABELS;
      current = SECTION_LABELS[label];
      const remainder = headerMatch[2]?.trim();
      if (remainder && current) {
        sections[current].push(remainder);
      }
      continue;
    }

    if (current) {
      sections[current].push(line);
    }
  }

  return sections;
}

function normalizeListItem(line: string): string {
  return line
    .replace(/^\s*[-*•]\s*/, "")
    .replace(/^\s*\d+[.)、]\s*/, "")
    .replace(/^\s*\(\d+\)\s*/, "")
    .trim();
}

function parseList(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const cleaned = normalizeListItem(line);
    if (cleaned) {
      items.push(cleaned);
    }
  }
  return items;
}

function parseAgentOutput(agentType: AgentType, content: string): AgentOutput {
  const trimmed = content.trim();
  const sections = extractSections(trimmed);

  const conclusion = firstNonEmpty(sections.conclusion) ?? firstNonEmpty([trimmed]) ?? "分析未完成";
  const evidence = parseList(sections.evidence);
  const risks = parseList(sections.risks);
  const suggestions = parseList(sections.suggestions);
  const falsifiable = firstNonEmpty(sections.falsifiable) ?? "需要进一步验证";

  return {
    agentType,
    conclusion,
    evidence,
    risks,
    suggestions,
    falsifiable
  };
}

async function callAnthropicWithRetry(prompt: string): Promise<CallAnthropicResult> {
  return retryWithBackoff(() => callAnthropic(prompt, {
    model: config.LLM_MODEL,
    maxTokens: config.LLM_MAX_TOKENS,
    timeout: config.LLM_TIMEOUT_MS,
  }), {
    shouldRetry: (error) => !isInvalidApiKeyError(error),
    maxRetries: config.MAX_RETRIES,
    baseDelayMs: config.RETRY_BASE_DELAY_MS,
    maxDelayMs: config.RETRY_MAX_DELAY_MS,
  });
}

const anthropicAdapter: LLMAdapter = {
  name: "anthropic",
  async generate(agentType: AgentType, prompt: string): Promise<AgentOutput> {
    const response = await callAnthropicWithRetry(prompt);
    return parseAgentOutput(agentType, response.content);
  }
};

const mockAdapter: LLMAdapter = {
  name: "mock",
  async generate(agentType: AgentType): Promise<AgentOutput> {
    return generateMockOutput(agentType);
  }
};
