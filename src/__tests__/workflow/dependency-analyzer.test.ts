// @ts-ignore - bun:test types provided by Bun runtime
import { test, expect } from "bun:test";
import {
  buildDependencyGraph,
  resolveExecutionWaves,
  detectCircularDependencies,
  calculateMinExecutionTime,
  calculateSpeedup,
  recordWaveStart,
  recordWaveEnd,
  summarizeExecutionPlan
} from "../../workflow/dependency-analyzer.js";
import type { AgentType } from "../../types.js";

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

test("buildDependencyGraph: 7 Agent 模式依赖图构建", () => {
  const graph = buildDependencyGraph(baseAgents, false);

  expect(graph.size).toBe(7);

  // Wave 1: 无依赖
  expect(graph.get("systems")?.dependsOn).toEqual([]);
  expect(graph.get("econ")?.dependsOn).toEqual([]);
  expect(graph.get("socio")?.dependsOn).toEqual([]);

  // Wave 2: 依赖 Wave 1
  const wave2Agents = ["governance", "culture", "risk"] as AgentType[];
  for (const agent of wave2Agents) {
    const deps = graph.get(agent)?.dependsOn?.sort();
    expect(deps).toEqual(["econ", "socio", "systems"]);
  }

  // Wave 3: validation 依赖所有其他 Agent
  const validationDeps = graph.get("validation")?.dependsOn?.sort();
  expect(validationDeps).toEqual([
    "culture",
    "econ",
    "governance",
    "risk",
    "socio",
    "systems"
  ]);
});

test("buildDependencyGraph: 12 Agent 模式依赖图构建", () => {
  const graph = buildDependencyGraph(extendedAgents, true);

  expect(graph.size).toBe(12);

  // Wave 1-5: 正常依赖关系
  expect(graph.get("systems")?.wave).toBe(1);
  expect(graph.get("econ")?.wave).toBe(1);
  expect(graph.get("socio")?.wave).toBe(1);

  expect(graph.get("governance")?.wave).toBe(2);
  expect(graph.get("culture")?.wave).toBe(2);
  expect(graph.get("risk")?.wave).toBe(2);

  expect(graph.get("environmental")?.wave).toBe(4);
  expect(graph.get("demographic")?.wave).toBe(4);
  expect(graph.get("infrastructure")?.wave).toBe(4);

  expect(graph.get("technology")?.wave).toBe(5);
  expect(graph.get("historical")?.wave).toBe(5);

  // Wave 6: validation 依赖所有其他 11 个 Agent
  const validation = graph.get("validation");
  expect(validation?.wave).toBe(6);
  expect(validation?.dependsOn).toHaveLength(11);
  expect(validation?.dependsOn).toContain("technology");
  expect(validation?.dependsOn).toContain("historical");
});

test("resolveExecutionWaves: 7 Agent 模式生成 3 波", () => {
  const plan = resolveExecutionWaves(baseAgents, false);

  expect(plan.waves).toHaveLength(3);
  expect(plan.dependencies.size).toBe(7);

  // Wave 1: 3 个 Agent 并行
  expect(plan.waves[0]?.wave).toBe(1);
  expect(plan.waves[0]?.agents?.sort()).toEqual((["econ", "socio", "systems"] as AgentType[]));
  expect(plan.waves[0]?.parallel).toBe(true);

  // Wave 2: 3 个 Agent 并行
  expect(plan.waves[1]?.wave).toBe(2);
  expect(plan.waves[1]?.agents?.sort()).toEqual((["culture", "governance", "risk"] as AgentType[]));
  expect(plan.waves[1]?.parallel).toBe(true);

  // Wave 3: 1 个 Agent 顺序
  expect(plan.waves[2]?.wave).toBe(3);
  expect(plan.waves[2]?.agents).toEqual((["validation"] as AgentType[]));
  expect(plan.waves[2]?.parallel).toBe(false);
});

test("resolveExecutionWaves: 12 Agent 模式生成 6 波", () => {
  const plan = resolveExecutionWaves(extendedAgents, true);

  expect(plan.waves).toHaveLength(6);
  expect(plan.dependencies.size).toBe(12);

  // Wave 1: 3 个 Agent 并行
  expect(plan.waves[0]?.wave).toBe(1);
  expect(plan.waves[0]?.agents?.sort()).toEqual((["econ", "socio", "systems"] as AgentType[]));
  expect(plan.waves[0]?.parallel).toBe(true);

  // Wave 2: 3 个 Agent 并行
  expect(plan.waves[1]?.wave).toBe(2);
  expect(plan.waves[1]?.agents?.sort()).toEqual((["culture", "governance", "risk"] as AgentType[]));
  expect(plan.waves[1]?.parallel).toBe(true);

  // Wave 3: 空（12 Agent 模式中 Wave 3 无 Agent）
  expect(plan.waves[2]?.wave).toBe(3);
  expect(plan.waves[2]?.agents).toEqual([]);

  // Wave 4: 3 个 Agent 并行
  expect(plan.waves[3]?.wave).toBe(4);
  expect(plan.waves[3]?.agents?.sort()).toEqual(([
    "demographic",
    "environmental",
    "infrastructure"
  ] as AgentType[]));

  // Wave 5: 2 个 Agent 并行
  expect(plan.waves[4]?.wave).toBe(5);
  expect(plan.waves[4]?.agents?.sort()).toEqual((["historical", "technology"] as AgentType[]));
  expect(plan.waves[4]?.parallel).toBe(true);

  // Wave 6: 1 个 Agent 顺序
  expect(plan.waves[5]?.wave).toBe(6);
  expect(plan.waves[5]?.agents).toEqual((["validation"] as AgentType[]));
  expect(plan.waves[5]?.parallel).toBe(false);
});

test("detectCircularDependencies: 7 Agent 模式无循环依赖", () => {
  const graph = buildDependencyGraph(baseAgents, false);
  const hasCycle = detectCircularDependencies(graph);
  expect(hasCycle).toBe(false);
});

test("detectCircularDependencies: 12 Agent 模式无循环依赖", () => {
  const graph = buildDependencyGraph(extendedAgents, true);
  const hasCycle = detectCircularDependencies(graph);
  expect(hasCycle).toBe(false);
});

test("detectCircularDependencies: 人工构造循环依赖应检测到", () => {
  const circularGraph = new Map<AgentType, { agent: AgentType; dependsOn: AgentType[]; wave: number }>();
  circularGraph.set("systems", { agent: "systems", dependsOn: ["econ"], wave: 1 });
  circularGraph.set("econ", { agent: "econ", dependsOn: ["socio"], wave: 1 });
  circularGraph.set("socio", { agent: "socio", dependsOn: ["systems"], wave: 1 });

  const hasCycle = detectCircularDependencies(circularGraph as any);
  expect(hasCycle).toBe(true);
});

test("calculateMinExecutionTime: 7 Agent 模式默认参数", () => {
  const plan = resolveExecutionWaves(baseAgents, false);
  const minTime = calculateMinExecutionTime(plan, 3000); // 3 波，每波 3 秒

  expect(minTime).toBe(9000); // 3 * 3000
});

test("calculateMinExecutionTime: 12 Agent 模式默认参数", () => {
  const plan = resolveExecutionWaves(extendedAgents, true);
  const minTime = calculateMinExecutionTime(plan, 3000); // 6 波，每波 3 秒

  expect(minTime).toBe(18000); // 6 * 3000
});

test("calculateSpeedup: 7 Agent 模式加速比", () => {
  const plan = resolveExecutionWaves(baseAgents, false);
  const speedup = calculateSpeedup(plan, 3000);

  // 顺序执行: 7 * 3s = 21s
  // 并行执行: 3 * 3s = 9s
  // 加速比: 21 / 9 = 2.33
  expect(speedup).toBeCloseTo(2.33, 2);
});

test("calculateSpeedup: 12 Agent 模式加速比", () => {
  const plan = resolveExecutionWaves(extendedAgents, true);
  const speedup = calculateSpeedup(plan, 3000);

  // 顺序执行: 12 * 3s = 36s
  // 并行执行: 6 * 3s = 18s
  // 加速比: 36 / 18 = 2.0
  expect(speedup).toBeCloseTo(2.0, 1);
});

test("recordWaveStart: 记录 Wave 开始时间", () => {
  const plan = resolveExecutionWaves(baseAgents, false);

  expect(plan.waves[0]?.startTime).toBe(0);

  const beforeStart = Date.now();
  recordWaveStart(plan, 1);
  const afterStart = Date.now();

  expect(plan.waves[0]?.startTime).toBeGreaterThanOrEqual(beforeStart);
  expect(plan.waves[0]?.startTime).toBeLessThanOrEqual(afterStart);
});

test("recordWaveEnd: 记录 Wave 结束时间和持续时间", () => {
  const plan = resolveExecutionWaves(baseAgents, false);

  recordWaveStart(plan, 1);
  // 模拟执行时间
  const startTime = plan.waves[0]?.startTime;
  expect(startTime).toBeGreaterThan(0);

  recordWaveEnd(plan, 1);

  expect(plan.waves[0]?.endTime).toBeDefined();
  expect(plan.waves[0]?.duration).toBeDefined();

  // 验证持续时间计算正确
  if (plan.waves[0]?.duration !== undefined) {
    expect(plan.waves[0]?.duration).toBeGreaterThanOrEqual(0);
  }

  // 验证 metrics map 已更新
  const metrics = plan.metrics.get(1);
  expect(metrics).toBeDefined();
  expect(metrics?.duration).toEqual(plan.waves[0]?.duration);
});

test("recordWaveStart/End: 不存在的 Wave 应抛出错误", () => {
  const plan = resolveExecutionWaves(baseAgents, false);

  expect(() => {
    recordWaveStart(plan, 99);
  }).toThrow("Wave 99 not found in execution plan");

  expect(() => {
    recordWaveEnd(plan, 99);
  }).toThrow("Wave 99 not found in execution plan");
});

test("summarizeExecutionPlan: 7 Agent 模式摘要", () => {
  const plan = resolveExecutionWaves(baseAgents, false);

  const summary = summarizeExecutionPlan(plan);

  expect(summary).toContain("=== Execution Plan Summary ===");
  expect(summary).toContain("Total Waves: 3");
  expect(summary).toContain("Total Agents: 7");
  expect(summary).toContain("Wave 1 (Parallel):");
  expect(summary).toContain("Wave 2 (Parallel):");
  expect(summary).toContain("Wave 3 (Sequential):");
  expect(summary).toContain("Theoretical Speedup:");
});

test("summarizeExecutionPlan: 12 Agent 模式摘要", () => {
  const plan = resolveExecutionWaves(extendedAgents, true);

  const summary = summarizeExecutionPlan(plan);

  expect(summary).toContain("=== Execution Plan Summary ===");
  expect(summary).toContain("Total Waves: 6");
  expect(summary).toContain("Total Agents: 12");
  expect(summary).toContain("Wave 1 (Parallel):");
  expect(summary).toContain("Wave 6 (Sequential):");
  expect(summary).toContain("Theoretical Speedup:");
});

test("summarizeExecutionPlan: 包含执行时间的摘要", () => {
  const plan = resolveExecutionWaves(baseAgents, false);

  // 模拟执行记录
  recordWaveStart(plan, 1);
  recordWaveEnd(plan, 1);

  const summary = summarizeExecutionPlan(plan);

  expect(summary).toContain("Duration:");
});

test("buildDependencyGraph: 部分子集 Agent", () => {
  const partialAgents: AgentType[] = ["systems", "econ", "governance"];
  const graph = buildDependencyGraph(partialAgents, false);

  expect(graph.size).toBe(3);
  expect(graph.get("systems")?.dependsOn).toEqual([]);
  expect(graph.get("econ")?.dependsOn).toEqual([]);

  // governance 原本依赖 3 个，现在只有 systems 和 econ 在图中
  const governanceDeps = graph.get("governance")?.dependsOn.sort();
  expect(governanceDeps).toEqual(["econ", "systems"]);
});

test("buildDependencyGraph: 未知 Agent 类型应抛出错误", () => {
  const invalidAgents: AgentType[] = ["systems", "unknown-agent" as AgentType];

  expect(() => {
    buildDependencyGraph(invalidAgents, false);
  }).toThrow("Unknown agent type");
});
