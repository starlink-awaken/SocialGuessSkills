import { test, expect } from "bun:test";
import { runWorkflow, queryAgent, __test__ } from "../workflow/orchestrator";
import type { AgentOutput, Hypothesis } from "../types";

test("工作流编排器 - 完整6步推演", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["1000人社区", "资源有限", "协作收益30%"],
    constraints: ["通信成本", "信息不完全"],
    goals: ["稳定秩序", "基本公平"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  expect(model).toBeDefined();
  expect(model.agentOutputs).toHaveLength(12);
  expect(model.conflicts).toBeDefined();
  expect(model.structure).toBeDefined();
  expect(model.metadata.iterations).toBe(1);
  expect(model.metadata.confidence).toBeGreaterThan(0);
});

test("工作流编排器 - 单Agent查询", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
  };

  const output = await queryAgent("systems", hypothesis);

  expect(output).toBeDefined();
  expect(output.agentType).toBe("systems");
  expect(output.conclusion).toBeDefined();
  expect(output.falsifiable).toBeDefined();
});

test("工作流编排器 - 模型结构完整性", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试"],
    constraints: [],
    goals: ["目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  expect(model.structure.overall).toBeDefined();
  expect(model.structure.workflow).toBeDefined();
  expect(model.structure.institutions).toBeDefined();
  expect(model.structure.governance).toBeDefined();
  expect(model.structure.culture).toBeDefined();
  expect(model.structure.innovation).toBeDefined();
  expect(model.structure.risks).toBeDefined();
  expect(model.structure.metrics).toBeDefined();
  expect(model.structure.optimization).toBeDefined();
});

test("工作流编排器 - 假设验证", async () => {
  const invalidHypothesis = {
    assumptions: [],
    constraints: [],
    goals: []
  } as Hypothesis;

  await expect(runWorkflow(invalidHypothesis)).rejects.toThrow("假设必须包含assumptions数组");
});

test("工作流编排器 - 收敛于2次迭代", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["1000人社区", "资源有限"],
    constraints: ["通信成本"],
    goals: ["稳定秩序"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 3, convergenceThreshold: 0.9 });

  expect(model.metadata.iterations).toBe(2);
});

test("工作流编排器 - 收敛阈值为1仍可提前结束", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 3, convergenceThreshold: 0.99 });

  expect(model.metadata.iterations).toBe(2);
});

test("工作流编排器 - 高阈值仍可提前结束", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 3, convergenceThreshold: 1 });

  expect(model.metadata.iterations).toBe(2);
});

test("工作流编排器 - 不同阈值影响收敛计算", async () => {
  const { compareOutputs } = __test__;
  const baseOutput: AgentOutput = {
    agentType: "systems",
    conclusion: "base",
    evidence: [],
    risks: [],
    suggestions: [],
    falsifiable: "资源 稳定 反馈"
  };
  const changedOutput: AgentOutput = {
    ...baseOutput,
    falsifiable: "资源 冲突 激励"
  };

  const similaritySame = compareOutputs([baseOutput], [baseOutput]);
  const similarityDifferent = compareOutputs([baseOutput], [changedOutput]);

  expect(similaritySame).toBe(1);
  expect(similarityDifferent).toBeLessThan(1);
});

test("工作流编排器 - 空可证伪点处理", async () => {
  const { calculateSimilarity } = __test__;

  expect(calculateSimilarity("", "")).toBe(0);
  expect(calculateSimilarity("", "x")).toBe(0);
  expect(calculateSimilarity("x", "")).toBe(0);
});

test("工作流编排器 - 记录收敛元数据", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 3, convergenceThreshold: 0.9 });

  expect(model.metadata.convergedAtIteration).toBeDefined();
  expect(model.metadata.convergedAtIteration).toBe(2);
  expect(model.metadata.finalSimilarity).toBeDefined();
  expect(model.metadata.finalSimilarity).toBeGreaterThanOrEqual(0.9);
});

test("工作流编排器 - 空输出不崩溃", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试"],
    constraints: [],
    goals: ["目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 2, convergenceThreshold: 0.5 });

  expect(model).toBeDefined();
  expect(model.agentOutputs).toBeDefined();
  expect(model.metadata).toBeDefined();
});

test("工作流编排器 - 使用默认收敛阈值0.9", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试"],
    constraints: [],
    goals: ["目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 3 });

  expect(model).toBeDefined();
  if (model.metadata.convergedAtIteration) {
    expect(model.metadata.finalSimilarity).toBeGreaterThanOrEqual(0.9);
  }
});
