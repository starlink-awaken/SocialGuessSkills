import type { AgentInstance, AgentOutput, AnalysisContext } from "../types";
import { callLLM } from "../utils/llm-client.js";
import { generateMockOutput } from "./mock-outputs.js";

const MOCK_MODE_VALUES = new Set(["1", "true", "yes", "on"]);

const SECTION_LABELS = {
  "结论": "conclusion",
  "依据": "evidence",
  "风险": "risks",
  "建议": "suggestions",
  "可证伪点": "falsifiable"
} as const;

type SectionKey = typeof SECTION_LABELS[keyof typeof SECTION_LABELS];

type ParsedSections = Record<SectionKey, string[]>;

export async function executeAgent(
  agent: AgentInstance,
  context: AnalysisContext
): Promise<AgentOutput> {
  const { hypothesis, previousOutputs, iteration, conflicts } = context;

  let contextualPrompt = agent.systemPrompt;

  if (previousOutputs && previousOutputs.size > 0) {
    contextualPrompt += "\n\n## 上下文信息\n\n";
    contextualPrompt += `### 当前迭代: ${iteration}\n\n`;
    contextualPrompt += `### 假设输入\n`;
    contextualPrompt += `- 假设: ${hypothesis.assumptions.join(", ")}\n`;
    contextualPrompt += `- 约束: ${hypothesis.constraints.join(", ")}\n`;
    contextualPrompt += `- 目标: ${hypothesis.goals.join(", ")}\n\n`;

    if (conflicts.length > 0) {
      contextualPrompt += `### 已检测到冲突 (${conflicts.length}个)\n`;
      contextualPrompt += conflicts.map(c => 
        `- [${c.type}] ${c.description} (涉及: ${c.involvedAgents.join(", ")})`
      ).join("\n") + "\n\n";
    }

    if (agent.agentType !== "systems") {
      contextualPrompt += "### 其他Agent分析结果\n";
      for (const [type, output] of previousOutputs) {
        if (type !== agent.agentType) {
          contextualPrompt += `\n**${output.agentType} Agent**:\n`;
          contextualPrompt += `- 结论: ${output.conclusion}\n`;
          contextualPrompt += `- 可证伪点: ${output.falsifiable}\n`;
        }
      }
    }
  }

  contextualPrompt += "\n\n## 你的分析\n\n";
  contextualPrompt += "基于以上信息,按照输出格式提供你的分析。";

  try {
    const output = await simulateAICall(agent.agentType, contextualPrompt);
    return output;
  } catch (error) {
    throw new Error(`Agent execution failed for ${agent.name}: ${String(error)}`);
  }
}

function shouldUseMock(): boolean {
  const raw = (process.env.AGENT_MOCK_MODE ?? "").toLowerCase();
  if (MOCK_MODE_VALUES.has(raw)) {
    return true;
  }
  return !process.env.GLM_API_KEY;
}

function getMockDelayMs(): number {
  const isTestEnv =
    process.env.BUN_TEST === "1" ||
    process.env.BUN_ENV === "test" ||
    process.env.NODE_ENV === "test" ||
    process.env.TEST === "1" ||
    process.env.CI === "true";
  if (isTestEnv) return 0;
  return Math.random() * 500 + 100;
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

function parseAgentOutput(agentType: string, content: string): AgentOutput {
  const trimmed = content.trim();
  const sections = extractSections(trimmed);

  const conclusion = firstNonEmpty(sections.conclusion) ?? firstNonEmpty([trimmed]) ?? "分析未完成";
  const evidence = parseList(sections.evidence);
  const risks = parseList(sections.risks);
  const suggestions = parseList(sections.suggestions);
  const falsifiable = firstNonEmpty(sections.falsifiable) ?? "需要进一步验证";

  return {
    agentType: agentType as AgentOutput["agentType"],
    conclusion,
    evidence,
    risks,
    suggestions,
    falsifiable
  };
}

async function simulateAICall(
  agentType: string,
  prompt: string
): Promise<AgentOutput> {
  if (!shouldUseMock()) {
    try {
      const response = await callLLM(prompt);
      return parseAgentOutput(agentType, response);
    } catch (error) {
      console.warn(`LLM API call failed for ${agentType}, falling back to mock:`, error);
    }
  }

  await new Promise(resolve => setTimeout(resolve, getMockDelayMs()));
  return generateMockOutput(agentType);
}
