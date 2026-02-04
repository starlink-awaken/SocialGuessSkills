import type { AgentInstance, AgentOutput, AnalysisContext } from "../types";
import type { CallAnthropicResult } from "./llm-client";
import { retryWithBackoff } from "../utils/retry";
import { config } from '../utils/config.js';

const MOCK_MODE_VALUES = new Set(["1", "true", "yes", "on"]);
let forceMock = false;
let anthropicAvailability: Promise<boolean> | null = null;

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
  if (forceMock) {
    return true;
  }
  const raw = (process.env.AGENT_MOCK_MODE ?? "").toLowerCase();
  if (MOCK_MODE_VALUES.has(raw)) {
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
        const { callAnthropic } = await import("./llm-client");
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

function isInvalidApiKeyError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return message.includes("api key") && (message.includes("invalid") || message.includes("expired"));
}

async function callAnthropicWithRetry(prompt: string): Promise<CallAnthropicResult> {
  const { callAnthropic } = await import("./llm-client");
  return retryWithBackoff(() => callAnthropic(prompt), {
    shouldRetry: (error) => !isInvalidApiKeyError(error),
    maxRetries: config.MAX_RETRIES,
    baseDelayMs: config.RETRY_BASE_DELAY_MS,
    maxDelayMs: config.RETRY_MAX_DELAY_MS,
  });
}

async function simulateAICall(
  agentType: string,
  prompt: string
): Promise<AgentOutput> {
  if (await canUseAnthropic()) {
    try {
      const response = await callAnthropicWithRetry(prompt);
      return parseAgentOutput(agentType, response.content);
    } catch (error) {
      if (!isInvalidApiKeyError(error)) {
        throw error;
      }
      forceMock = true;
      anthropicAvailability = Promise.resolve(false);
    }
  }

  await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 100));

  const outputs: Record<string, AgentOutput> = {
    systems: {
      agentType: "systems",
      conclusion: "系统需要建立清晰的反馈回路才能在资源稀缺条件下稳定运行",
      evidence: [
        "协作能提升总产出30%,但需要明确的产权与分配机制",
        "信任降低交易成本,而信任来自公平感知和稳定预期",
        "缺乏负反馈机制会导致小矛盾演变为系统崩溃"
      ],
      risks: [
        "资源极端稀缺时,正反馈可能加速资源耗尽导致系统崩溃",
        "若治理成本超过协作收益,系统会转向低效率的自给自足模式"
      ],
      suggestions: [
        "设定资源使用上限阈值,建立早期预警系统",
        "设计分层治理降低治理成本与响应时间"
      ],
      falsifiable: "若系统在3个月内未能建立起稳定的资源分配与冲突解决机制,则正反馈回路假设不成立"
    },
    econ: {
      agentType: "econ",
      conclusion: "必须建立清晰的产权界定与贡献-回报连接机制才能防止搭便车行为",
      evidence: [
        "资源稀缺导致零和博弈倾向,若无产权规则将出现公地悲剧",
        "协作收益30%的前提是每个人都能公平分享产出",
        "搭便车行为若超过20%阈值,协作系统将因负担过重而瓦解"
      ],
      risks: [
        "若贡献衡量成本过高,会导致激励失效",
        "在极端稀缺下,公平分配可能损害效率,导致整体产出下降"
      ],
      suggestions: [
        "建立积分系统记录贡献,定期公开排名以形成声誉压力",
        "设定最低贡献门槛,未达标者降低分配比例"
      ],
      falsifiable: "若在产权清晰且奖励机制执行3个月后,搭便车比例仍超过15%,则激励相容设计失效"
    },
    socio: {
      agentType: "socio",
      conclusion: "需要设计公共仪式与共同叙事将1000人从陌生人网络转化为共同体",
      evidence: [
        "1000人规模已超过邓巴数(150),无法仅靠人际关系维持合作",
        "共同叙事可降低内群体-外群体界限",
        "仪式行为强化身份认同与信任"
      ],
      risks: [
        "若叙事与实际体验不符,会强化不信任",
        "在高压情境下,身份认同可能被利用来排斥异见者"
      ],
      suggestions: [
        "设立每周社区大会,公开讨论问题并记录共同决策",
        "创造共同目标,通过协作过程增强'我们'感"
      ],
      falsifiable: "若在实施仪式与叙事6个月后,合作意愿仍未显著提升(>50%),则认同机制假设不成立"
    },
    governance: {
      agentType: "governance",
      conclusion: "需要三层治理结构并明确权责边界才能保证规则有效执行",
      evidence: [
        "1000人规模已超出熟人社会治理,需制度化执行体系",
        "执行力需要权责对称",
        "监督成本随层级增加,需设计公众监督机制降低内部监督成本"
      ],
      risks: [
        "若中央层权力过大,会压制基层创新与地方适应性",
        "在资源极端稀缺时,治理可能异化为强制分配,合法性下降"
      ],
      suggestions: [
        "设立社区议会(15-20人)作为决策层,小组(50人)作为执行层",
        "权责清单化:每个职位明确列出权力与对应责任"
      ],
      falsifiable: "若在明确权责且监督机制执行3个月后,规则遵守率仍低于70%,则执行力假设不成立"
    },
    culture: {
      agentType: "culture",
      conclusion: "需设计每周公共仪式与共享符号系统,将陌生人网络转化为共同体认同",
      evidence: [
        "1000人超出熟人社会范围,需制度化身份认同替代人格信任",
        "仪式定期重复强化'我们'感,降低内群体-外群体界限",
        "符号系统简化复杂价值观,便于快速协调"
      ],
      risks: [
        "若仪式流于形式而缺乏真实互动,认同感不会实质增强",
        "在危机情境下,共同认同可能异化为排他性"
      ],
      suggestions: [
        "每周举办社区大会,包含信息分享、公开讨论、共同决策",
        "设计社区徽章与口号,在公共场合展示并要求成员佩戴"
      ],
      falsifiable: "若在仪式与符号系统实施6个月后,社区成员的'我们'认同指数仍未超过60%,则文化机制假设不成立"
    },
    risk: {
      agentType: "risk",
      conclusion: "资源极端稀缺时易出现信任崩塌与权力集中,需预设应急储备与权力边界",
      evidence: [
        "稀缺度超过临界点时,合作收益递减而竞争收益上升",
        "危机情境下权力集中是自然反应,但若无边界会异化为专制",
        "有应急储备的社区存活率高出无储备社区3倍"
      ],
      risks: [
        "若应急储备被提前挪用,真实危机时会全面崩溃",
        "紧急权力若无限期延长,危机后难以恢复常态治理"
      ],
      suggestions: [
        "建立分级储备:基础生存储备(30天食物+饮水) + 战略储备(关键工具)",
        "预设紧急权力边界:明确列出可临时启用的权力,并设定自动恢复期限(90天后失效)"
      ],
      falsifiable: "若在模拟资源危机测试中,预设机制未能将系统崩溃率降低50%以下,则风险缓解策略假设不成立"
    },
    validation: {
      agentType: "validation",
      conclusion: "需为每条核心机制设计可证伪假设,并用小型社区历史案例交叉验证",
      evidence: [
        "无可证伪假设的理论不可验证,可能沦为价值倡导而非科学分析",
        "历史上10-50人共同体的经验可直接类比1000人社区",
        "对比成功与失败案例可识别关键机制"
      ],
      risks: [
        "若可证伪假设设定过宽,可能导致理论永远'不被证伪'",
        "历史案例的情境差异过大,可能导致错误类比"
      ],
      suggestions: [
        "为每条核心结论设定具体的时间窗口与指标",
        "选取3个历史案例:成功案例、失败案例、部分成功"
      ],
      falsifiable: "若在模型实施6个月后,所有可证伪假设均无法被检验,则验证框架失效"
    }
  };

  return outputs[agentType] || {
    agentType: agentType as any,
    conclusion: "分析未完成",
    evidence: [],
    risks: ["AI调用失败"],
    suggestions: ["重试"],
    falsifiable: "无法验证"
  };
}
