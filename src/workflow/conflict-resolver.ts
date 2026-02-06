import type { Conflict, AgentType, AgentOutput } from "../types";

export function detectConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];

  conflicts.push(...detectLogicalConflicts(outputs));
  conflicts.push(...detectPriorityConflicts(outputs));
  conflicts.push(...detectRiskAmplification(outputs));
  conflicts.push(...detectGoalConflicts(outputs));
  conflicts.push(...detectConstraintConflicts(outputs));
  conflicts.push(...detectEvidenceConflicts(outputs));

  return conflicts;
}

function detectLogicalConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const conclusionKeywords = {
    systems: ["反馈", "回路", "稳定"],
    econ: ["激励", "产权", "效率"],
    socio: ["认同", "规范", "共同体"],
    governance: ["权力", "执行", "监督"],
    culture: ["仪式", "符号", "认同"],
    risk: ["崩溃", "储备", "缓冲"],
    validation: ["可证伪", "反例", "验证"]
  };

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const agentA = outputs[i];
      const agentB = outputs[j];

      // Guard against undefined agents (shouldn't happen for well-formed inputs)
      if (!agentA || !agentB) continue;

      const keywordsA = conclusionKeywords[agentA.agentType as keyof typeof conclusionKeywords] || [];
      const keywordsB = conclusionKeywords[agentB.agentType as keyof typeof conclusionKeywords] || [];

      const falsifiableA = agentA.falsifiable ?? "";
      const falsifiableB = agentB.falsifiable ?? "";

      const hasConflict = falsifiableB.toLowerCase().includes(keywordsA.join("|")) ||
                        falsifiableA.toLowerCase().includes(keywordsB.join("|"));

      if (hasConflict) {
        conflicts.push({
          type: "logical",
          involvedAgents: [agentA.agentType, agentB.agentType],
          description: `${agentA.agentType}的结论可能与${agentB.agentType}的可证伪点冲突`,
          severity: "medium",
          resolutionStrategy: "需重新审视两个Agent的假设边界,明确适用条件"
        });
      }
    }
  }

  return conflicts;
}

function detectPriorityConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const priorityMatrix: Record<AgentType, number> = {
    systems: 3,
    econ: 2,
    socio: 2,
    governance: 4,
    culture: 2,
    risk: 5,
    validation: 1
  };

  const suggestionGroups = new Map<string, AgentType[]>();

  outputs.forEach(output => {
    output.suggestions.forEach(suggestion => {
      const key = suggestion.substring(0, 20);
      if (!suggestionGroups.has(key)) {
        suggestionGroups.set(key, []);
      }
      suggestionGroups.get(key)!.push(output.agentType);
    });
  });

  suggestionGroups.forEach((agents, key) => {
    if (agents.length > 1) {
      const highPriorityAgent = agents.sort((a, b) => 
        priorityMatrix[b] - priorityMatrix[a]
      )[0];

      conflicts.push({
        type: "priority",
        involvedAgents: agents,
        description: `多个Agent提出相似建议: "${key}...",应优先采纳${highPriorityAgent}的视角`,
        severity: "low",
        resolutionStrategy: `按优先级排序(Risk > Governance > Systems > Econ/Socio/Culture > Validation),采纳${highPriorityAgent}的建议`
      });
    }
  });

  const resourceKeywords = ["资源", "分配", "储备", "投入", "产出"];
  const resourceSuggestions = outputs.flatMap(o => 
    o.suggestions.filter(s => resourceKeywords.some(k => s.includes(k)))
                         .map(s => ({ agent: o.agentType, suggestion: s }))
  );

  if (resourceSuggestions.length > 1) {
    const agents = [...new Set(resourceSuggestions.map(r => r.agent))];
    if (agents.length > 1) {
      conflicts.push({
        type: "priority",
        involvedAgents: agents,
        description: "多个Agent对资源配置提出互斥建议",
        severity: "high",
        resolutionStrategy: "按优先级采纳,并由Governance Agent最终决策"
      });
    }
  }

  return conflicts;
}

function detectRiskAmplification(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];

  const riskKeywords = {
    "崩溃": 5,
    "失稳": 4,
    "瓦解": 5,
    "崩塌": 5,
    "异化": 3,
    "失效": 4,
    "失败": 4
  };

  let totalRiskScore = 0;
  const riskDetails: string[] = [];

  outputs.forEach(output => {
    output.risks.forEach(risk => {
      for (const [keyword, score] of Object.entries(riskKeywords)) {
        if (risk.includes(keyword)) {
          totalRiskScore += score;
          riskDetails.push(`${output.agentType}: ${risk.substring(0, 50)}...`);
          break;
        }
      }
    });
  });

  const avgRiskPerAgent = totalRiskScore / outputs.length;

  if (avgRiskPerAgent > 3) {
    conflicts.push({
      type: "risk_amplification",
      involvedAgents: outputs.map(o => o.agentType),
      description: `整体风险水平过高(平均${avgRiskPerAgent.toFixed(1)}分/Agent),多个Agent识别到高风险点`,
      severity: "high",
      resolutionStrategy: "需优先由Risk Agent审查,设计缓冲与冗余机制,降低整体脆弱性"
    });
  }

  const highRiskAgents = outputs.filter(o => 
    o.risks.some(r => ["崩溃", "瓦解", "崩塌"].some(k => r.includes(k)))
  );

  if (highRiskAgents.length >= 3) {
    conflicts.push({
      type: "risk_amplification",
      involvedAgents: highRiskAgents.map(o => o.agentType),
      description: `多个Agent(${highRiskAgents.length}个)识别到系统崩溃风险,需强化韧性与缓冲机制`,
      severity: "high",
      resolutionStrategy: "启动风险缓解方案,建立应急储备,预设权力边界,防止连锁崩溃"
    });
  }

  return conflicts;
}

function detectGoalConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const goalKeywords = {
    systems: ["效率", "优化", "改进"],
    econ: ["利润", "最大化", "增长"],
    socio: ["公平", "平等", "分配"],
    governance: ["控制", "监管", "稳定"],
    culture: ["传统", "保护", "延续"],
    risk: ["稳健", "安全", "防护"],
    validation: ["验证", "测试", "评估"]
  };

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const agentA = outputs[i];
      const agentB = outputs[j];

      if (!agentA || !agentB) continue;

      // Check if one agent prioritizes efficiency while another prioritizes stability
      const agentAType = agentA.agentType as keyof typeof goalKeywords;
      const agentBType = agentB.agentType as keyof typeof goalKeywords;
      const keywordsA = goalKeywords[agentAType] || [];
      const keywordsB = goalKeywords[agentBType] || [];

      // Check for conflicting goals (efficiency vs stability, profit vs equality, etc.)
      const conflictPairs: [string[], string[]][] = [
        [["效率", "增长"], ["公平", "平等", "稳定"]], // econ vs socio/governance
        [["控制", "监管"], ["自由", "创新"]], // governance vs systems
        [["传统", "保护"], ["效率", "优化"]], // culture vs systems
        [["稳健", "安全"], ["最大化", "增长"]] // risk vs econ
      ];

      for (const [goalsA, goalsB] of conflictPairs) {
        const agentAHasGoals = keywordsA.some(k => goalsA.includes(k));
        const agentBHasGoals = keywordsB.some(k => goalsB.includes(k));

        if (agentAHasGoals && agentBHasGoals) {
          conflicts.push({
            type: "goal",
            involvedAgents: [agentA.agentType, agentB.agentType],
            description: `${agentA.agentType}的目标(${keywordsA.join("/")})与${agentB.agentType}的目标(${keywordsB.join("/")})存在潜在冲突`,
            severity: "medium",
            resolutionStrategy: "需明确优先级顺序,建立目标权衡机制,寻求多目标共赢方案"
          });
          break; // Avoid duplicate conflicts
        }
      }
    }
  }

  return conflicts;
}

function detectConstraintConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const constraintKeywords = {
    systems: ["必须", "应当", "强制"],
    econ: ["成本", "预算", "资源限制"],
    socio: ["参与", "共识", "民主"],
    governance: ["法规", "合规", "审批"],
    culture: ["习俗", "禁忌", "规范"],
    risk: ["风险阈值", "安全标准", "底线"],
    validation: ["测试条件", "验证标准", "证据要求"]
  };

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const agentA = outputs[i];
      const agentB = outputs[j];

      if (!agentA || !agentB) continue;

      const agentAType = agentA.agentType as keyof typeof constraintKeywords;
      const agentBType = agentB.agentType as keyof typeof constraintKeywords;
      const keywordsA = constraintKeywords[agentAType] || [];
      const keywordsB = constraintKeywords[agentBType] || [];

      // Check for incompatible constraints
      const incompatiblePairs: [string[], string[]][] = [
        [["强制", "必须"], ["应当", "建议", "自主"]], // strict vs flexible
        [["成本限制"], ["高投入", "资源充足"]], // econ vs systems (resource mismatch)
        [["法规", "合规"], ["灵活", "创新"]], // governance vs culture
        [["风险阈值"], ["激进", "最大化"]], // risk vs econ
        [["测试条件"], ["快速", "敏捷"]] // validation vs systems
      ];

      for (const [constraintsA, constraintsB] of incompatiblePairs) {
        const agentAConstraints = keywordsA.some(k => constraintsA.includes(k));
        const agentBConstraints = keywordsB.some(k => constraintsB.includes(k));

        if (agentAConstraints && agentBConstraints) {
          conflicts.push({
            type: "constraint",
            involvedAgents: [agentA.agentType, agentB.agentType],
            description: `${agentA.agentType}的约束条件(${keywordsA.join("/")})与${agentB.agentType}的约束条件(${keywordsB.join("/")})不兼容`,
            severity: "medium",
            resolutionStrategy: "需重新评估约束条件的必要性和可执行性,寻求折中方案或分阶段实施"
          });
          break;
        }
      }
    }
  }

  return conflicts;
}

function detectEvidenceConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const agentA = outputs[i];
      const agentB = outputs[j];

      if (!agentA || !agentB) continue;

      // Check for contradictory falsifiable evidence
      const falsifiableA = agentA.falsifiable ?? "";
      const falsifiableB = agentB.falsifiable ?? "";

      if (!falsifiableA || !falsifiableB) continue;

      // Evidence contradictions
      const contradictionPatterns = [
        { pattern1: ["必然"], pattern2: ["可能", "也许", "不确定"] },
        { pattern1: ["不可能"], pattern2: ["可行", "可以实现"] },
        { pattern1: ["完全", "总是"], pattern2: ["很少", "有时"] },
        { pattern1: ["增加"], pattern2: ["减少", "下降"] },
        { pattern1: ["稳定"], pattern2: ["波动", "不稳定"] }
      ];

      for (const { pattern1, pattern2 } of contradictionPatterns) {
        const hasPattern1 = pattern1.some(p => falsifiableA.includes(p));
        const hasPattern2 = pattern2.some(p => falsifiableB.includes(p));

        if (hasPattern1 && hasPattern2) {
          conflicts.push({
            type: "evidence",
            involvedAgents: [agentA.agentType, agentB.agentType],
            description: `${agentA.agentType}的可证伪点"${falsifiableA.substring(0, 50)}..."与${agentB.agentType}的可证伪点"${falsifiableB.substring(0, 50)}..."存在逻辑矛盾`,
            severity: "high",
            resolutionStrategy: "需重新验证双方证据,明确适用条件和边界条件,或寻求第三方验证"
          });
          break;
        }
      }
    }
  }

  return conflicts;
}

export function suggestResolution(conflict: Conflict): string {
  if (conflict.resolutionStrategy) {
    return conflict.resolutionStrategy;
  }

  switch (conflict.type) {
    case "logical":
      return "重新审视矛盾双方的假设边界,明确适用条件,避免冲突";
    case "priority":
      return "按优先级排序(Risk > Governance > Systems > Econ/Socio/Culture > Validation)采纳建议";
    case "risk_amplification":
      return "启动风险缓解方案,建立缓冲与冗余机制,降低整体脆弱性";
    case "goal":
      return "需明确优先级顺序,建立目标权衡机制,寻求多目标共赢方案";
    case "constraint":
      return "需重新评估约束条件的必要性和可执行性,寻求折中方案或分阶段实施";
    case "evidence":
      return "需重新验证双方证据,明确适用条件和边界条件,或寻求第三方验证";
    default:
      return "需人工审查并决策";
  }
}

export function filterConflictsBySeverity(
  conflicts: Conflict[],
  minSeverity: 'low' | 'medium' | 'high'
): Conflict[] {
  const severityOrder = ['low', 'medium', 'high'];
  const minIndex = severityOrder.indexOf(minSeverity);

  return conflicts.filter(c => 
    severityOrder.indexOf(c.severity) >= minIndex
  );
}
