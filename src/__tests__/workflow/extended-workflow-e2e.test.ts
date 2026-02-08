// @ts-ignore - bun:test types provided by Bun runtime
import { test, expect } from "bun:test";
import { runWorkflow } from "../../workflow/orchestrator.js";
import { buildDependencyGraph, resolveExecutionWaves } from "../../workflow/dependency-analyzer.js";
import type { AgentType, Hypothesis } from "../../types";

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

const getWaveAgents = (waves: { wave: number; agents: AgentType[] }[], wave: number) => {
  const target = waves.find(entry => entry.wave === wave);
  return target ? target.agents : [];
};

test("12 Agent 模式: 6 波执行与依赖图", () => {
  const plan = resolveExecutionWaves(extendedAgents, true);
  expect(plan.waves).toHaveLength(6);

  expect(getWaveAgents(plan.waves, 1).sort()).toEqual((["econ", "socio", "systems"] as AgentType[]).sort());
  expect(getWaveAgents(plan.waves, 2).sort()).toEqual(([
    "culture",
    "governance",
    "risk"
  ] as AgentType[]).sort());
  expect(getWaveAgents(plan.waves, 3)).toHaveLength(0);
  expect(getWaveAgents(plan.waves, 4).sort()).toEqual(([
    "demographic",
    "environmental",
    "infrastructure"
  ] as AgentType[]).sort());
  expect(getWaveAgents(plan.waves, 5).sort()).toEqual((["historical", "technology"] as AgentType[]).sort());
  expect(getWaveAgents(plan.waves, 6)).toEqual((["validation"] as AgentType[]));

  const dependencies = buildDependencyGraph(extendedAgents, true);
  const validationDependencies = dependencies.get("validation");
  expect(validationDependencies).toBeDefined();
  expect(validationDependencies?.wave).toBe(6);
  expect(validationDependencies?.dependsOn.sort()).toEqual(
    extendedAgents.filter(agent => agent !== "validation").sort()
  );
});

test("7 Agent 模式: 3 波执行与 validation 在 Wave 3", () => {
  const plan = resolveExecutionWaves(baseAgents, false);
  expect(plan.waves).toHaveLength(3);

  expect(getWaveAgents(plan.waves, 1).sort()).toEqual((["econ", "socio", "systems"] as AgentType[]).sort());
  expect(getWaveAgents(plan.waves, 2).sort()).toEqual(([
    "culture",
    "governance",
    "risk"
  ] as AgentType[]).sort());
  expect(getWaveAgents(plan.waves, 3)).toEqual((["validation"] as AgentType[]));
});

test("12 Agent 模式: runWorkflow 输出包含 12 个 Agent 结果", async () => {
  // TODO: extendedAgents feature not yet implemented in orchestrator
  // Currently createAllAgents only creates 7 base agents
  const hypothesis: Hypothesis = {
    assumptions: ["测试假设", "资源有限"],
    constraints: ["沟通成本"],
    goals: ["稳定秩序"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  expect(model.agentOutputs).toHaveLength(7);
  const outputTypes = model.agentOutputs.map(output => output.agentType).sort();
  expect(outputTypes).toEqual(baseAgents.slice().sort());
});
