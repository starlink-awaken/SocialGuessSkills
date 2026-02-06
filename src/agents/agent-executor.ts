import type { AgentInstance, AgentOutput, AnalysisContext } from "../types";
import { getLLMAdapter } from "./llm-adapter.js";

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
    const adapter = await getLLMAdapter();
    return await adapter.generate(agent.agentType, contextualPrompt);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Agent execution failed for ${agent.name}: ${message}`);
  }
}

export function buildErrorOutput(agentType: AgentOutput["agentType"], error: unknown): AgentOutput {
  const message = error instanceof Error ? error.message : String(error);
  return {
    agentType,
    conclusion: `Agent ${agentType} 执行失败`,
    evidence: [],
    risks: [`执行失败: ${message}`],
    suggestions: ["检查日志并重试", "确认API配置与网络状态"],
    falsifiable: "无法验证",
    error: message
  };
}
