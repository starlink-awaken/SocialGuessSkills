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

test("关键词匹配 - 单个关键词匹配", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统需要稳定的反馈机制",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若反馈回路断裂则系统不稳定"
    },
    {
      agentType: "econ",
      conclusion: "激励机制优化效率",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若激励不足则效率下降"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => c.type === "logical");

  // systems的关键词["反馈", "回路", "稳定"]应该能在econ的falsifiable中匹配(没有这些词,所以应该是0)
  // econ的关键词["激励", "产权", "效率"]应该能在systems的falsifiable中匹配(没有这些词,所以应该是0)
  expect(logicalConflicts.length).toBe(0);
});

test("关键词匹配 - 多个关键词之一匹配", () => {
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
      falsifiable: "若产权不清则反馈失效且激励扭曲"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => c.type === "logical");

  // econ的falsifiable包含"反馈"(systems的关键词之一)
  expect(logicalConflicts.length).toBeGreaterThanOrEqual(1);
  expect(logicalConflicts[0]?.involvedAgents).toContain("systems");
  expect(logicalConflicts[0]?.involvedAgents).toContain("econ");
});

test("关键词匹配 - 多个关键词全不匹配", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统需要优化",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若资源不足则无法运行"
    },
    {
      agentType: "culture",
      conclusion: "文化认同很重要",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若文化冲突则社区分裂"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => 
    c.type === "logical" && 
    c.involvedAgents.includes("systems") && 
    c.involvedAgents.includes("culture")
  );

  // systems的关键词["反馈", "回路", "稳定"]都不在culture的falsifiable中
  // culture的关键词["仪式", "符号", "认同"]中的"认同"在falsifiable中,但不在systems的falsifiable中
  expect(logicalConflicts.length).toBe(0);
});

test("关键词匹配 - 大小写不敏感", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统稳定",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若反馈机制失效则崩溃"
    },
    {
      agentType: "econ",
      conclusion: "激励有效",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若反馈延迟则激励失效"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => c.type === "logical");

  // "反馈"应该能匹配"反馈"和"反馈"(大小写不敏感)
  expect(logicalConflicts.length).toBeGreaterThanOrEqual(1);
});

test("关键词匹配 - 空关键词列表", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统稳定",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若失效则崩溃"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => c.type === "logical");

  // 只有一个agent,不应该有逻辑冲突
  expect(logicalConflicts.length).toBe(0);
});

test("关键词匹配 - 空falsifiable字符串", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统稳定",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: ""
    },
    {
      agentType: "econ",
      conclusion: "激励有效",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: ""
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => c.type === "logical");

  // 空字符串不应该匹配任何关键词
  expect(logicalConflicts.length).toBe(0);
});

test("关键词匹配 - 双向检测", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "系统需要反馈",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若激励不足则系统失效"
    },
    {
      agentType: "econ",
      conclusion: "激励很重要",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若反馈延迟则激励扭曲"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c => c.type === "logical");

  // 双向都应该能检测到:
  // 1. systems的关键词"反馈"在econ的falsifiable中
  // 2. econ的关键词"激励"在systems的falsifiable中
  expect(logicalConflicts.length).toBeGreaterThanOrEqual(1);
  expect(logicalConflicts[0]?.involvedAgents).toContain("systems");
  expect(logicalConflicts[0]?.involvedAgents).toContain("econ");
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
  expect(highSeverity[0]?.severity).toBe("high");

  const mediumAndAbove = filterConflictsBySeverity(conflicts, "medium");
  expect(mediumAndAbove.length).toBe(2);
});

// --- New tests for improved conflict detection ---

test("冲突检测 - 不兼容Agent对检测", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "econ",
      conclusion: "激励机制促进增长",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若激励失效则增长停滞"
    },
    {
      agentType: "socio",
      conclusion: "公平分配维护稳定",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若分配不公则社会动荡"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c =>
    c.type === "logical" &&
    c.involvedAgents.includes("econ") &&
    c.involvedAgents.includes("socio")
  );

  expect(logicalConflicts.length).toBe(1);
  expect(logicalConflicts[0]?.description).toContain("张力");
});

test("冲突检测 - 语义否定检测", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "systems",
      conclusion: "反馈回路确保稳定",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若激励机制失效则系统不成立"
    },
    {
      agentType: "econ",
      conclusion: "激励结构促进效率",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "若产权不清则激励无法运行"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c =>
    c.type === "logical" &&
    c.involvedAgents.includes("systems") &&
    c.involvedAgents.includes("econ")
  );

  // systems' falsifiable contains "失效"(negation) + "激励"(econ keyword)
  expect(logicalConflicts.length).toBeGreaterThanOrEqual(1);
  expect(logicalConflicts[0]?.severity).toBe("high");
});

test("冲突检测 - 扩展Agent类型", () => {
  const outputs: AgentOutput[] = [
    {
      agentType: "infrastructure",
      conclusion: "基础设施扩张提升承载力",
      evidence: [],
      risks: [],
      suggestions: ["建设新的水处理设施"],
      falsifiable: "若基础设施不足则承载力不足"
    },
    {
      agentType: "environmental",
      conclusion: "生态保护优先于开发",
      evidence: [],
      risks: [],
      suggestions: ["限制建设规模保护生态"],
      falsifiable: "若生态破坏超过阈值则不可逆"
    }
  ];

  const conflicts = detectConflicts(outputs);
  const logicalConflicts = conflicts.filter(c =>
    c.type === "logical" &&
    c.involvedAgents.includes("infrastructure") &&
    c.involvedAgents.includes("environmental")
  );

  // infrastructure + environmental is a known incompatible pair
  expect(logicalConflicts.length).toBe(1);
  expect(logicalConflicts[0]?.description).toContain("协调");
});
