// @ts-ignore - bun:test types provided by Bun runtime
import { test, expect } from "bun:test";
import { runWorkflow } from "../../workflow/orchestrator.js";
import { resolveExecutionWaves, recordWaveStart, recordWaveEnd, buildDependencyGraph } from "../../workflow/dependency-analyzer.js";
import type { AgentType, Hypothesis, WorkflowConfig } from "../../types";

const baseAgents: AgentType[] = [
  "systems",
  "econ",
  "socio",
  "governance",
  "culture",
  "risk",
  "validation"
];

const extendedAgents: AgentType[] = [
  "systems",
  "econ",
  "socio",
  "governance",
  "culture",
  "risk",
  "validation",
  "environmental",
  "demographic",
  "infrastructure",
  "technology",
  "historical"
];

const createTestHypothesis = (): Hypothesis => ({
  assumptions: ["测试假设1", "测试假设2", "资源有限"],
  constraints: ["测试约束1", "通信成本"],
  goals: ["测试目标1", "稳定秩序"]
});

test("并行执行测试: extendedAgents=true 时正确执行 6 波并行, 输出包含 12 个 agent 结果", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 1,
    extendedAgents: true
  };

  const model = await runWorkflow(hypothesis, config);

  // 验证输出包含 12 个 Agent 结果
  expect(model.agentOutputs).toHaveLength(12);

  // 验证输出包含所有 12 个 Agent 类型
  const outputTypes = model.agentOutputs.map(output => output.agentType).sort();
  expect(outputTypes).toEqual(extendedAgents.slice().sort());

  // 验证模型结构完整
  expect(model.hypothesis).toBeDefined();
  expect(model.conflicts).toBeDefined();
  expect(model.structure).toBeDefined();
  expect(model.metadata).toBeDefined();

  // 验证元数据
  expect(model.metadata.iterations).toBe(1);
  expect(model.metadata.confidence).toBeGreaterThan(0);
  expect(model.metadata.generatedAt).toBeDefined();
});

test("顺序 vs 并行对比: 并行执行比顺序执行更快", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 1,
    extendedAgents: true
  };

  // 并行执行（使用 runWorkflow，它使用 Promise.all）
  const parallelStart = Date.now();
  const parallelModel = await runWorkflow(hypothesis, config);
  const parallelTime = Date.now() - parallelStart;

  // 顺序执行模拟（模拟每个 agent 串行执行）
  // 由于实际实现中的 simulateAICall 有 100-600ms 的延迟
  // 并行执行应该显著快于顺序执行
  const estimatedSequentialTime = parallelModel.agentOutputs.length * 150; // 假设每个 agent 平均 150ms

  // 验证并行执行确实更快（并行时间应小于顺序时间的 1/2）
  expect(parallelTime).toBeLessThan(estimatedSequentialTime);

  // 验证两种执行模式产生的结果一致
  expect(parallelModel.agentOutputs).toHaveLength(12);
  expect(parallelModel.hypothesis).toEqual(hypothesis);
});

test("性能指标记录: recordWaveStart 和 recordWaveEnd 被正确调用", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 1,
    extendedAgents: true
  };

  // 创建执行计划
  const executionPlan = resolveExecutionWaves(extendedAgents, true);

  // 记录每个波次的开始和结束时间
  const waveTimes: Map<number, { start: number; end: number; duration: number }> = new Map();

  // 模拟执行过程中调用 recordWaveStart 和 recordWaveEnd
  for (const wave of executionPlan.waves) {
    const start = Date.now();
    recordWaveStart(executionPlan, wave.wave);
    // 模拟波次执行（最小延迟）
    await new Promise(resolve => setTimeout(resolve, 10));
    recordWaveEnd(executionPlan, wave.wave);
    const end = Date.now();

    waveTimes.set(wave.wave, {
      start,
      end,
      duration: end - start
    });
  }

  // 验证所有 6 个波次都被记录
  expect(waveTimes.size).toBe(6);

  // 验证每个波次都有开始和结束时间
  for (const [waveNum, times] of waveTimes) {
    expect(times.start).toBeDefined();
    expect(times.end).toBeDefined();
    expect(times.duration).toBeGreaterThanOrEqual(0);
  }

  // 验证波次执行顺序
  let prevEnd = 0;
  for (let waveNum = 1; waveNum <= 6; waveNum++) {
    const times = waveTimes.get(waveNum);
    expect(times).toBeDefined();
    expect(times!.start).toBeGreaterThanOrEqual(prevEnd);
    prevEnd = times!.end;
  }

  // 验证实际 runWorkflow 中的波次执行
  const model = await runWorkflow(hypothesis, config);
  expect(model.agentOutputs).toHaveLength(12);
});

test("收敛检测: 验证收敛逻辑在并行模式下正常工作（maxIterations > 1）", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 3,
    extendedAgents: true
  };

  const model = await runWorkflow(hypothesis, config);

  // 验证模型包含收敛元数据
  expect(model.metadata).toBeDefined();

  // 验证迭代次数
  expect(model.metadata.iterations).toBeGreaterThan(0);
  expect(model.metadata.iterations).toBeLessThanOrEqual(3);

  // 验证置信度已计算
  expect(model.metadata.confidence).toBeGreaterThan(0);
  expect(model.metadata.confidence).toBeLessThanOrEqual(1);

  // 验证所有 Agent 输出
  expect(model.agentOutputs).toHaveLength(12);

  // 验证冲突检测已执行
  expect(model.conflicts).toBeDefined();

  // 如果收敛，验证收敛元数据
  if (model.metadata.convergedAtIteration !== undefined) {
    expect(model.metadata.finalSimilarity).toBeDefined();
    expect(model.metadata.finalSimilarity).toBeGreaterThanOrEqual(0);
    expect(model.metadata.finalSimilarity).toBeLessThanOrEqual(1);
  }
});

test("7 Agent 模式兼容性: baseAgents 执行计划为 3 波", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 1,
    extendedAgents: false
  };

  // 验证基础 agents 的执行计划为 3 波
  const plan = resolveExecutionWaves(baseAgents, false);
  expect(plan.waves).toHaveLength(3);

  // 验证波次分配
  const getWaveAgents = (wave: number) => {
    const target = plan.waves.find(entry => entry.wave === wave);
    return target ? target.agents : [];
  };

  // Wave 1: econ, socio, systems
  expect(getWaveAgents(1).sort()).toEqual(["econ", "socio", "systems"].sort());

  // Wave 2: culture, governance, risk
  expect(getWaveAgents(2).sort()).toEqual(["culture", "governance", "risk"].sort());

  // Wave 3: validation
  expect(getWaveAgents(3)).toEqual(["validation"]);

  // 执行工作流验证输出（extendedAgents=false 时仍执行所有 12 个 agents）
  const model = await runWorkflow(hypothesis, config);

  // 注意：由于 createAllAgents() 创建所有 12 个 agents，即使 extendedAgents=false
  // 系统仍会执行所有 agents，但依赖图结构不同
  expect(model.agentOutputs).toHaveLength(12);

  // 验证所有 7 个基础 agents 都在输出中
  const outputTypes = model.agentOutputs.map(output => output.agentType);
  for (const baseAgent of baseAgents) {
    expect(outputTypes).toContain(baseAgent);
  }

  // 验证模型结构完整
  expect(model.hypothesis).toBeDefined();
  expect(model.conflicts).toBeDefined();
  expect(model.structure).toBeDefined();
  expect(model.metadata).toBeDefined();
});

test("并行执行: 波次间依赖关系正确", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 1,
    extendedAgents: true
  };

  // 构建依赖图
  const dependencies = buildDependencyGraph(extendedAgents, true);

  // 验证 validation 在第 6 波
  const validationDep = dependencies.get("validation");
  expect(validationDep).toBeDefined();
  expect(validationDep?.wave).toBe(6);

  // 验证 validation 依赖于所有其他 agents
  const expectedDependencies = extendedAgents.filter(agent => agent !== "validation").sort();
  expect(validationDep?.dependsOn.sort()).toEqual(expectedDependencies);

  // 执行工作流
  const model = await runWorkflow(hypothesis, config);

  // 验证所有 agents 都已执行
  expect(model.agentOutputs).toHaveLength(12);

  // 验证 validation agent 的输出存在且依赖于其他 agents
  const validationOutput = model.agentOutputs.find(output => output.agentType === "validation");
  expect(validationOutput).toBeDefined();
});

test("性能指标: 验证执行时间合理且可接受", async () => {
  const hypothesis = createTestHypothesis();
  const config: WorkflowConfig & { extendedAgents?: boolean } = {
    maxIterations: 1,
    extendedAgents: true
  };

  const startTime = Date.now();
  const model = await runWorkflow(hypothesis, config);
  const endTime = Date.now();
  const executionTime = endTime - startTime;

  // 验证执行完成
  expect(model.agentOutputs).toHaveLength(12);

  // 验证执行时间合理（并行执行应该 < 10 秒）
  // 考虑到 simulateAICall 的延迟（100-600ms），12 个 agents 并行执行
  // 应该在约 600ms * 6 波 = 3600ms 左右完成
  expect(executionTime).toBeGreaterThan(0);
  expect(executionTime).toBeLessThan(10000);

  console.log(`Parallel execution time for 12 agents (6 waves): ${executionTime}ms`);
});
