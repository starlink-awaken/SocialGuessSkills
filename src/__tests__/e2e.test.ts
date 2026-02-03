import { test, expect } from "bun:test";
import { runWorkflow } from "../workflow/orchestrator.js";

test("端到端测试 - 社区治理示例推演", async () => {
  const hypothesis = {
    assumptions: [
      "1000人社区,资源有限",
      "协作可提升总产出30%",
      "无外部干预,孤立环境"
    ],
    constraints: [
      "通信成本:当面交流免费",
      "信息不完全:个体只知道邻近50人的状态"
    ],
    goals: [
      "保证所有人基本生存",
      "建立可持续的资源生产与分配机制",
      "冲突解决机制可执行"
    ]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 2 });

  expect(model).toBeDefined();
  expect(model.agentOutputs).toHaveLength(7);
  expect(model.conflicts).toBeDefined();
  expect(model.structure).toBeDefined();
  expect(model.metadata.iterations).toBeGreaterThan(0);
  expect(model.metadata.confidence).toBeGreaterThan(0);
  expect(model.metadata.confidence).toBeLessThanOrEqual(1);
});

test("端到端测试 - 模型结构完整性", async () => {
  const hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
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
  
  const overallKeys = Object.keys(model.structure.overall);
  expect(overallKeys).toContain("resourceLayer");
  expect(overallKeys).toContain("behaviorLayer");
  expect(overallKeys).toContain("governanceLayer");
  expect(overallKeys).toContain("culturalLayer");
});

test("端到端测试 - Agent输出格式验证", async () => {
  const hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  model.agentOutputs.forEach(output => {
    expect(output.agentType).toBeDefined();
    expect(output.conclusion).toBeDefined();
    expect(output.conclusion.length).toBeGreaterThan(0);
    expect(output.evidence).toBeInstanceOf(Array);
    expect(output.risks).toBeInstanceOf(Array);
    expect(output.suggestions).toBeInstanceOf(Array);
    expect(output.falsifiable).toBeDefined();
    expect(output.falsifiable.length).toBeGreaterThan(0);
  });
});

test("端到端测试 - 冲突检测验证", async () => {
  const hypothesis = {
    assumptions: ["资源稀缺", "权力集中", "民主决策"],
    constraints: [],
    goals: ["稳定", "公平", "效率"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  expect(model.conflicts).toBeDefined();
  
  const hasLogicalConflicts = model.conflicts.some(c => c.type === "logical");
  const hasPriorityConflicts = model.conflicts.some(c => c.type === "priority");
  
  expect(model.conflicts.length).toBeGreaterThanOrEqual(0);
});

test("端到端测试 - 执行时间基准", async () => {
  const hypothesis = {
    assumptions: ["测试假设"],
    constraints: [],
    goals: ["测试目标"]
  };

  const startTime = Date.now();
  const model = await runWorkflow(hypothesis, { maxIterations: 1 });
  const endTime = Date.now();
  const duration = endTime - startTime;

  expect(model).toBeDefined();
  expect(duration).toBeLessThan(60000);
});
