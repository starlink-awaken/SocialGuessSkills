import { test, expect } from "bun:test";
import { runWorkflow, queryAgent } from "../workflow/orchestrator";
import type { Hypothesis } from "../types";

test("工作流编排器 - 完整6步推演", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["1000人社区", "资源有限", "协作收益30%"],
    constraints: ["通信成本", "信息不完全"],
    goals: ["稳定秩序", "基本公平"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  expect(model).toBeDefined();
  expect(model.agentOutputs).toHaveLength(7);
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
