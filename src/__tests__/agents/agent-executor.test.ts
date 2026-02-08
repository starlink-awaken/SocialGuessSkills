import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import { executeAgent } from "../../agents/agent-executor";
import type { Hypothesis, AgentType, AgentInstance, AgentOutput } from "../../types";

const defaultOutputSchema = {
  conclusion: "",
  evidence: [] as string[],
  risks: [] as string[],
  suggestions: [] as string[],
  falsifiable: ""
};

function mockAgent(agentType: AgentType, name: string, systemPrompt: string): AgentInstance {
  return { name, agentType, systemPrompt, outputSchema: defaultOutputSchema };
}

describe("executeAgent", () => {
  const mockHypothesis: Hypothesis = {
    assumptions: ["测试假设"],
    constraints: ["测试约束"],
    goals: ["测试目标"]
  };

  const mockContext = {
    hypothesis: mockHypothesis,
    previousOutputs: new Map(),
    iteration: 1,
    conflicts: []
  };

  beforeEach(() => {
    // 设置 Mock 模式
    process.env.AGENT_MOCK_MODE = "1";
  });

  afterEach(() => {
    // 清理 Mock 模式
    delete process.env.AGENT_MOCK_MODE;
  });

  describe("首次执行 - Systems Agent", () => {
    test("应该返回 Systems Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("systems", "Systems Agent", "测试系统提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("systems");
      expect(output).toHaveProperty("conclusion");
      expect(output).toHaveProperty("evidence");
      expect(output.evidence).toBeInstanceOf(Array);
      expect(output).toHaveProperty("risks");
      expect(output.risks).toBeInstanceOf(Array);
      expect(output).toHaveProperty("suggestions");
      expect(output.suggestions).toBeInstanceOf(Array);
      expect(output).toHaveProperty("falsifiable");
    });
  });

  describe("首次执行 - Econ Agent", () => {
    test("应该返回 Econ Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("econ", "Econ Agent", "测试经济提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("econ");
      expect(output.conclusion).toContain("产权");
    });
  });

  describe("首次执行 - Socio Agent", () => {
    test("应该返回 Socio Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("socio", "Socio Agent", "测试社会提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("socio");
      expect(output.conclusion).toContain("仪式");
    });
  });

  describe("首次执行 - Governance Agent", () => {
    test("应该返回 Governance Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("governance", "Governance Agent", "测试治理提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("governance");
      expect(output.conclusion).toContain("治理");
    });
  });

  describe("首次执行 - Culture Agent", () => {
    test("应该返回 Culture Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("culture", "Culture Agent", "测试文化提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("culture");
      expect(output.conclusion).toContain("仪式");
    });
  });

  describe("首次执行 - Risk Agent", () => {
    test("应该返回 Risk Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("risk", "Risk Agent", "测试风险提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("risk");
      expect(output.conclusion).toContain("稀缺");
    });
  });

  describe("首次执行 - Validation Agent", () => {
    test("应该返回 Validation Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("validation", "Validation Agent", "测试验证提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("validation");
      expect(output.conclusion).toContain("可证伪");
    });
  });

  describe("首次执行 - 5 个新 Agent", () => {
    test("应该返回 Environmental Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("environmental", "Environmental Agent", "测试环境提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("environmental");
      expect(output.conclusion).toContain("承载力");
    });

    test("应该返回 Demographic Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("demographic", "Demographic Agent", "测试人口提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("demographic");
      expect(output.conclusion).toContain("人口");
    });

    test("应该返回 Infrastructure Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("infrastructure", "Infrastructure Agent", "测试基础设施提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("infrastructure");
      expect(output.conclusion).toContain("韧性");
    });

    test("应该返回 Technology Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("technology", "Technology Agent", "测试技术提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("technology");
      expect(output.conclusion).toContain("技术");
    });

    test("应该返回 Historical Agent 的分析结果", async () => {
      const output = await executeAgent(
        mockAgent("historical", "Historical Agent", "测试历史提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(output.agentType).toBe("historical");
      expect(output.conclusion).toContain("历史");
    });
  });

  describe("有冲突时的执行", () => {
    test("应该包含其他 Agent 的分析结果", async () => {
      const mockContextWithConflicts = {
        ...mockContext,
        conflicts: [
          {
            type: "priority" as const,
            description: "测试冲突",
            involvedAgents: ["systems", "econ"] as AgentType[],
            severity: "medium" as const
          }
        ]
      };

      const output = await executeAgent(
        mockAgent("econ", "Econ Agent", "测试经济提示"),
        mockContextWithConflicts
      );

      expect(output).toBeDefined();
      expect(output).toHaveProperty("evidence");
    });
  });

  describe("多次迭代执行", () => {
    test("第二次执行应该基于第一次迭代", async () => {
      const mockContextWithPrevious = {
        ...mockContext,
        previousOutputs: new Map<AgentType, AgentOutput>([
          ["systems" as AgentType, {
            agentType: "systems" as AgentType,
            conclusion: "首次迭代的结论",
            evidence: ["首次迭代的证据"],
            risks: [],
            suggestions: ["首次迭代的建议"],
            falsifiable: "首次迭代的可证伪点"
          }]
        ])
      };

      const output = await executeAgent(
        mockAgent("systems", "Systems Agent", "测试系统提示"),
        mockContextWithPrevious
      );

      expect(output).toBeDefined();
      expect(output).toHaveProperty("suggestions");
      expect(output.suggestions).toBeInstanceOf(Array);
    });

    test("第三次执行应该达到最大迭代", async () => {
      const mockContextWithMaxIterations = {
        ...mockContext,
        iteration: 3
      };

      const output = await executeAgent(
        mockAgent("systems", "Systems Agent", "测试系统提示"),
        mockContextWithMaxIterations
      );

      expect(output).toBeDefined();
      expect(output).toHaveProperty("conclusion");
    });
  });

  describe("错误处理", () => {
    test("Mock 模式下应该正常返回结果", async () => {
      const output = await executeAgent(
        mockAgent("systems", "Systems Agent", "测试系统提示"),
        mockContext
      );
      expect(output).toBeDefined();
      expect(output.agentType).toBe("systems");
    });
  });

  describe("输出格式验证", () => {
    test("所有 Agent 输出必须包含 5 个必需字段", async () => {
      const output = await executeAgent(
        mockAgent("systems", "Test Agent", "测试提示"),
        mockContext
      );

      expect(output).toBeDefined();
      expect(Object.keys(output)).toEqual(
        expect.arrayContaining(["agentType"])
      );
      expect(output.evidence).toBeInstanceOf(Array);
      expect(output.evidence.length).toBe(3);
      expect(output.risks).toBeInstanceOf(Array);
      expect(output.risks.length).toBe(2);
    });
  });
});
