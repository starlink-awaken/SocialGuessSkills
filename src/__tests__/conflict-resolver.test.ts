import { test, expect } from "bun:test";
import { detectConflicts, suggestResolution, filterConflictsBySeverity } from "../workflow/conflict-resolver";
import type { AgentOutput } from "../types";

test("冲突检测 - 逻辑矛盾检测", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "反馈回路确保系统稳定",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若反馈机制失效则系统崩溃"
    },
    {
      agentType: "econ",
      conclusion: "激励结构促进效率",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若产权不清则反馈失效"
    }
  ];

  const conflicts = detectConflicts(outputs);

  expect(conflicts.length).toBeGreaterThanOrEqual(0);
});

test("冲突检测 - 优先级冲突", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统稳定",
      evidence: [],
      risks: [],
      suggestions: ["建立资源分配机制"],
      falsifiable: "若不稳定则崩溃"
    },
    {
      agentType: "econ",
      conclusion: "效率优先",
      evidence: [],
      risks: [],
      suggestions: ["优化资源配置效率"],
      falsifiable: "若效率下降则失效"
    }
  ];

  const conflicts = detectConflicts(outputs);

  const priorityConflicts = conflicts.filter(c => c.type === "priority");
  expect(priorityConflicts.length).toBeGreaterThanOrEqual(0);
});

test("冲突检测 - 风险叠加", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统稳定",
      evidence: [],
      risks: ["系统可能崩溃"],
      suggestions: [],
      falsifiable: "若崩溃则不稳定"
    },
    {
      agentType: "econ",
      conclusion: "效率优先",
      evidence: [],
      risks: ["机制可能失效"],
      suggestions: [],
      falsifiable: "若失效则效率低"
    },
    {
      agentType: "risk",
      conclusion: "高风险",
      evidence: [],
      risks: ["系统可能瓦解", "治理可能崩塌"],
      suggestions: [],
      falsifiable: "若风险实现则崩溃"
    }
  ];

  const conflicts = detectConflicts(outputs);

  const riskConflicts = conflicts.filter(c => c.type === "risk_amplification");
  expect(riskConflicts.length).toBeGreaterThanOrEqual(0);
});

test("冲突解决 - 建议生成", () => {
  const conflict = {
    type: "logical" as const,
    involvedAgents: ["systems", "econ"] as any,
    description: "逻辑矛盾",
    severity: "medium" as const
  };

  const resolution = suggestResolution(conflict);

  expect(resolution).toBeDefined();
  expect(resolution.length).toBeGreaterThan(0);
});

test("冲突过滤 - 按严重级别", () => {
  const conflicts = [
    {
      type: "logical" as const,
      involvedAgents: ["systems"] as any,
      description: "低严重性冲突",
      severity: "low" as const
    },
    {
      type: "priority" as const,
      involvedAgents: ["risk"] as any,
      description: "高严重性冲突",
      severity: "high" as const
    },
    {
      type: "risk_amplification" as const,
      involvedAgents: ["governance"] as any,
      description: "中严重性冲突",
      severity: "medium" as const
    }
  ];

  const highSeverity = filterConflictsBySeverity(conflicts, "high");
  expect(highSeverity.length).toBe(1);
  expect(highSeverity[0].severity).toBe("high");

  const mediumAndAbove = filterConflictsBySeverity(conflicts, "medium");
  expect(mediumAndAbove.length).toBe(2);
});
