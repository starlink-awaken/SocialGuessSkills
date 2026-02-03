import type { Conflict, AgentType, AgentOutput } from "../types";

export function detectConflicts(outputs: AgentOutput[]): Conflict[] {
  const conflicts: Conflict[] = [];

  conflicts.push(...detectLogicalConflicts(outputs));
  conflicts.push(...detectPriorityConflicts(outputs));
  conflicts.push(...detectRiskAmplification(outputs));

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
    risk: ["崩溃", "储备", "缓冲"]
  };

  for (let i = 0; i < outputs.length; i++) {
    for (let j = i + 1; j < outputs.length; j++) {
      const agentA = outputs[i];
      const agentB = outputs[j];

      const keywordsA = conclusionKeywords[agentA.agentType] || [];
      const keywordsB = conclusionKeywords[agentB.agentType] || [];

      const hasConflict = agentB.falsifiable.toLowerCase().includes(keywordsA.join("|")) ||
                        agentA.falsifiable.toLowerCase().includes(keywordsB.join("|"));

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
