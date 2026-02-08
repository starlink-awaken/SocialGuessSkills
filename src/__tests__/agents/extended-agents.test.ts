// @ts-ignore - bun:test types provided by Bun runtime
import { describe, test, expect } from "bun:test";
import { loadPrompt } from "../../agents/agent-factory.js";
import { executeAgent } from "../../agents/agent-executor.js";
import type { AgentType, Hypothesis } from "../../types";

describe("Extended Agents", () => {
  const hypothesis: Hypothesis = {
    assumptions: ["2035年前", "发达国家"],
    constraints: ["保持社会稳定"],
    goals: ["分析就业与社会结构变化"]
  };

  const agentTypes: AgentType[] = [
    "environmental",
    "demographic",
    "infrastructure",
    "technology",
    "historical"
  ];

  const mockContext = {
    hypothesis,
    previousOutputs: new Map(),
    iteration: 1,
    conflicts: []
  };

  test.each(agentTypes)("Prompt 加载: %s", async (agentType: AgentType) => {
    const prompt = await loadPrompt(agentType);
    expect(prompt).toBeDefined();
    expect(prompt.length).toBeGreaterThan(700);
    expect(prompt).toContain("核心职责");
  });

  test.each(agentTypes)("Mock 输出格式: %s", async (agentType: AgentType) => {
    const prompt = await loadPrompt(agentType);
    const output = await executeAgent(
      {
        name: `Test ${agentType} Agent`,
        agentType,
        systemPrompt: prompt,
        outputSchema: {
          conclusion: "",
          evidence: [],
          risks: [],
          suggestions: [],
          falsifiable: ""
        }
      },
      mockContext
    );
    expect(output).toBeDefined();
    expect(output.agentType).toBe(agentType);
    expect(output).toHaveProperty("conclusion");
    expect(output).toHaveProperty("evidence");
    expect(output).toHaveProperty("risks");
    expect(output).toHaveProperty("suggestions");
    expect(output).toHaveProperty("falsifiable");
    expect(output.evidence).toHaveLength(3);
    expect(output.risks).toHaveLength(2);
  });
});
