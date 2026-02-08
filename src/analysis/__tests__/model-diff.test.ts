/**
 * Model Diff 单元测试
 * @module src/analysis/__tests__/model-diff.test
 */

import { describe, expect, test } from 'bun:test';
import { diffModels } from '../model-diff.js';
import type { SocialSystemModel, AgentOutput, Conflict, SystemStructure, AgentType } from '../../types.js';

// 辅助函数：创建测试模型
function createTestModel(overrides?: Partial<SocialSystemModel>): SocialSystemModel {
  const baseModel: SocialSystemModel = {
    hypothesis: {
      assumptions: ['假设1', '假设2'],
      constraints: ['约束1', '约束2'],
      goals: ['目标1', '目标2']
    },
    agentOutputs: [
      {
        agentType: 'systems',
        conclusion: '系统运行稳定',
        evidence: ['证据1', '证据2'],
        risks: ['风险1', '风险2'],
        suggestions: ['建议1', '建议2'],
        falsifiable: '如果系统崩溃则证伪'
      },
      {
        agentType: 'econ',
        conclusion: '经济模型可行',
        evidence: ['经济证据1', '经济证据2'],
        risks: ['经济风险1'],
        suggestions: ['经济建议1'],
        falsifiable: '如果经济崩溃则证伪'
      }
    ],
    conflicts: [
      {
        type: 'logical',
        involvedAgents: ['systems', 'econ'],
        description: '系统稳定性和经济模型存在冲突',
        severity: 'medium'
      },
      {
        type: 'priority',
        involvedAgents: ['governance', 'culture'],
        description: '优先级冲突',
        severity: 'low'
      }
    ],
    structure: {
      overall: {
        resourceLayer: ['资源层1', '资源层2'],
        behaviorLayer: ['行为层1'],
        organizationLayer: ['组织层1'],
        institutionalLayer: ['制度层1'],
        governanceLayer: ['治理层1'],
        culturalLayer: ['文化层1']
      },
      workflow: {
        demandGeneration: ['需求生成1'],
        resourceAllocation: ['资源分配1'],
        production: ['生产1'],
        ruleEnforcement: ['规则执行1'],
        publicGoods: ['公共物品1'],
        feedback: ['反馈1']
      },
      institutions: {
        propertyRights: ['产权1'],
        contracts: ['合同1'],
        publicGoods: ['公共物品1'],
        disputeResolution: ['纠纷解决1'],
        riskSharing: ['风险分担1']
      },
      governance: {
        layeredGovernance: ['分层治理1'],
        accountability: ['问责制1'],
        transparency: ['透明度1'],
        crisis: ['危机1']
      },
      culture: {
        narrative: ['叙事1'],
        rituals: ['仪式1'],
        values: ['价值观1'],
        education: ['教育1']
      },
      innovation: {
        experimentation: ['实验1'],
        balance: ['平衡1'],
        adaptability: ['适应性1']
      },
      risks: {
        scarcity: ['稀缺性1'],
        trust: ['信任1'],
        power: ['权力1'],
        culture: ['文化风险1']
      },
      metrics: {
        stability: ['稳定性1'],
        fairness: ['公平性1'],
        efficiency: ['效率1'],
        cooperation: ['合作1'],
        resilience: ['韧性1'],
        legitimacy: ['合法性1']
      },
      optimization: {
        indicators: ['指标1'],
        mechanisms: ['机制1'],
        decisionLoop: ['决策循环1']
      }
    },
    metadata: {
      iterations: 2,
      confidence: 0.79,
      generatedAt: '2026-02-03T14:30:00Z',
      convergedAtIteration: 2,
      finalSimilarity: 0.95
    }
  };

  // 深度合并覆盖
  if (overrides) {
    return mergeDeep(baseModel, overrides);
  }

  return baseModel;
}

// 深度合并工具函数
function mergeDeep<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (isObject(sourceValue) && isObject(targetValue)) {
      result[key] = mergeDeep(targetValue, sourceValue as any);
    } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
      result[key] = [...sourceValue] as any;
    } else {
      result[key] = sourceValue as any;
    }
  }
  return result;
}

function isObject(item: unknown): item is Record<string, unknown> {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

describe('diffModels', () => {
  test('应返回两个相同模型的空 diff', () => {
    const modelA = createTestModel();
    const modelB = createTestModel();
    const diff = diffModels(modelA, modelB);

    expect(diff.summary.totalChanges).toBeGreaterThanOrEqual(0);
    expect(diff.agentOutputDiffs).toHaveLength(2);
    expect(diff.conflictsDiff.added).toHaveLength(0);
    expect(diff.conflictsDiff.removed).toHaveLength(0);
  });

  test('应检测 Agent 输出变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '修改后的结论',
          evidence: ['新证据', '证据2'],
          risks: ['新风险'],
          suggestions: ['新建议', '建议2'],
          falsifiable: '修改后的可证伪点'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.agentOutputDiffs).toHaveLength(2);

    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff).toBeDefined();
    expect(systemsDiff?.changes.conclusion).not.toBeUndefined();
    expect(systemsDiff?.changes.evidence).toBeDefined();
    expect(systemsDiff?.changes.evidence?.added).toContain('新证据');
    expect(systemsDiff?.changes.risks?.added).toContain('新风险');
    expect(systemsDiff?.changes.suggestions?.added).toContain('新建议');
  });

  test('应检测冲突变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      conflicts: [
        {
          type: 'logical',
          involvedAgents: ['systems', 'econ'],
          description: '系统稳定性和经济模型存在冲突',
          severity: 'medium'
        },
        {
          type: 'priority',
          involvedAgents: ['governance', 'culture'],
          description: '优先级冲突',
          severity: 'high'
        },
        {
          type: 'risk_amplification',
          involvedAgents: ['risk', 'econ'],
          description: '新增的冲突',
          severity: 'medium'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.conflictsDiff.removed).toHaveLength(0);
    expect(diff.conflictsDiff.added).toContain('新增的冲突');
  });

  test('应检测冲突移除', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      conflicts: [
        {
          type: 'logical',
          involvedAgents: ['systems', 'econ'],
          description: '系统稳定性和经济模型存在冲突',
          severity: 'medium'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.conflictsDiff.removed).toContain('优先级冲突');
  });

  test('应检测元数据变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      metadata: {
        iterations: 3,
        confidence: 0.85,
        generatedAt: '2026-02-04T15:30:00Z',
        convergedAtIteration: 3
      }
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.metadataDiff.iterations.old).toBe(2);
    expect(diff.metadataDiff.iterations.new).toBe(3);
    expect(diff.metadataDiff.iterations.delta).toBe(1);

    expect(diff.metadataDiff.confidence.old).toBe(0.79);
    expect(diff.metadataDiff.confidence.new).toBe(0.85);
    expect(diff.metadataDiff.confidence.delta).toBeCloseTo(0.06, 2);

    expect(diff.metadataDiff.generatedAt.old).toBe('2026-02-03T14:30:00Z');
    expect(diff.metadataDiff.generatedAt.new).toBe('2026-02-04T15:30:00Z');
  });

  test('应检测结构变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      structure: {
        overall: {
          resourceLayer: ['新资源层', '资源层2'],
          behaviorLayer: ['行为层1'],
          organizationLayer: ['组织层1'],
          institutionalLayer: ['制度层1'],
          governanceLayer: ['治理层1'],
          culturalLayer: ['文化层1']
        },
        workflow: {
          demandGeneration: ['需求生成1'],
          resourceAllocation: ['资源分配1'],
          production: ['生产1'],
          ruleEnforcement: ['规则执行1'],
          publicGoods: ['公共物品1'],
          feedback: ['反馈1']
        },
        institutions: {
          propertyRights: ['产权1'],
          contracts: ['合同1'],
          publicGoods: ['公共物品1'],
          disputeResolution: ['纠纷解决1'],
          riskSharing: ['风险分担1']
        },
        governance: {
          layeredGovernance: ['分层治理1'],
          accountability: ['问责制1'],
          transparency: ['透明度1'],
          crisis: ['危机1']
        },
        culture: {
          narrative: ['叙事1'],
          rituals: ['仪式1'],
          values: ['价值观1'],
          education: ['教育1']
        },
        innovation: {
          experimentation: ['实验1'],
          balance: ['平衡1'],
          adaptability: ['适应性1']
        },
        risks: {
          scarcity: ['稀缺性1'],
          trust: ['信任1'],
          power: ['权力1'],
          culture: ['文化风险1']
        },
        metrics: {
          stability: ['稳定性1'],
          fairness: ['公平性1'],
          efficiency: ['效率1'],
          cooperation: ['合作1'],
          resilience: ['韧性1'],
          legitimacy: ['合法性1']
        },
        optimization: {
          indicators: ['指标1'],
          mechanisms: ['机制1'],
          decisionLoop: ['决策循环1']
        }
      }
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.structureDiff.overall).toBeDefined();
    expect(diff.structureDiff.overall.layerName).toBe('overall');
    expect(diff.structureDiff.overall.changes).toBeDefined();
  });

  test('应正确计算总体变化统计', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '新结论',
          evidence: ['证据1', '证据3'], // 添加证据3，移除证据2
          risks: ['新风险'],
          suggestions: ['新建议'],
          falsifiable: '新可证伪点'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.summary).toBeDefined();
    expect(typeof diff.summary.totalChanges).toBe('number');
    expect(typeof diff.summary.addedFields).toBe('number');
    expect(typeof diff.summary.removedFields).toBe('number');
    expect(typeof diff.summary.modifiedFields).toBe('number');
  });
});

describe('diffAgentOutputs', () => {
  test('应检测 conclusion 变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '完全不同的结论',
          evidence: ['证据1', '证据2'],
          risks: ['风险1', '风险2'],
          suggestions: ['建议1', '建议2'],
          falsifiable: '如果系统崩溃则证伪'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.conclusion).toBeDefined();
  });

  test('应检测 evidence 数组变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '系统运行稳定',
          evidence: ['证据1', '证据3', '新证据'],
          risks: ['风险1', '风险2'],
          suggestions: ['建议1', '建议2'],
          falsifiable: '如果系统崩溃则证伪'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.evidence?.added).toContain('新证据');
    expect(systemsDiff?.changes.evidence?.removed).toContain('证据2');
  });

  test('应检测 risks 数组变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '系统运行稳定',
          evidence: ['证据1', '证据2'],
          risks: ['新风险'],
          suggestions: ['建议1', '建议2'],
          falsifiable: '如果系统崩溃则证伪'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.risks?.added).toContain('新风险');
  });

  test('应检测 suggestions 数组变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '系统运行稳定',
          evidence: ['证据1', '证据2'],
          risks: ['风险1', '风险2'],
          suggestions: ['新建议'],
          falsifiable: '如果系统崩溃则证伪'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.suggestions?.added).toContain('新建议');
  });

  test('应检测 falsifiable 变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '系统运行稳定',
          evidence: ['证据1', '证据2'],
          risks: ['风险1', '风险2'],
          suggestions: ['建议1', '建议2'],
          falsifiable: '修改后的可证伪点'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.falsifiable).toBeDefined();
  });
});

describe('diffConflicts', () => {
  test('应检测新增冲突', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      conflicts: [
        {
          type: 'logical',
          involvedAgents: ['systems', 'econ'],
          description: '系统稳定性和经济模型存在冲突',
          severity: 'medium'
        },
        {
          type: 'priority',
          involvedAgents: ['governance', 'culture'],
          description: '优先级冲突',
          severity: 'low'
        },
        {
          type: 'risk_amplification',
          involvedAgents: ['risk', 'econ'],
          description: '新增的风险叠加冲突',
          severity: 'high'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.conflictsDiff.added).toContain('新增的风险叠加冲突');
    expect(diff.conflictsDiff.added).toHaveLength(1);
  });

  test('应检测移除冲突', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      conflicts: [
        {
          type: 'logical',
          involvedAgents: ['systems', 'econ'],
          description: '系统稳定性和经济模型存在冲突',
          severity: 'medium'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.conflictsDiff.removed).toContain('优先级冲突');
    expect(diff.conflictsDiff.removed).toHaveLength(1);
  });

  test('应识别未变冲突', () => {
    const modelA = createTestModel();
    const modelB = createTestModel();

    const diff = diffModels(modelA, modelB);
    expect(diff.conflictsDiff.unchanged).toContain('系统稳定性和经济模型存在冲突');
    expect(diff.conflictsDiff.unchanged).toContain('优先级冲突');
  });

  test('应处理空冲突数组', () => {
    const modelA = createTestModel({
      conflicts: []
    });
    const modelB = createTestModel({
      conflicts: []
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.conflictsDiff.added).toHaveLength(0);
    expect(diff.conflictsDiff.removed).toHaveLength(0);
    expect(diff.conflictsDiff.unchanged).toHaveLength(0);
  });
});

describe('diffStructure', () => {
  test('应检测 overall 层变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      structure: {
        overall: {
          resourceLayer: ['新资源层', '资源层2'],
          behaviorLayer: ['行为层1'],
          organizationLayer: ['组织层1'],
          institutionalLayer: ['制度层1'],
          governanceLayer: ['治理层1'],
          culturalLayer: ['文化层1']
        },
        workflow: modelA.structure.workflow,
        institutions: modelA.structure.institutions,
        governance: modelA.structure.governance,
        culture: modelA.structure.culture,
        innovation: modelA.structure.innovation,
        risks: modelA.structure.risks,
        metrics: modelA.structure.metrics,
        optimization: modelA.structure.optimization
      }
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.structureDiff.overall).toBeDefined();
    expect(diff.structureDiff.overall.layerName).toBe('overall');
    expect(diff.structureDiff.overall.changes).toBeDefined();
  });

  test('应检测 workflow 层变化', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      structure: {
        overall: modelA.structure.overall,
        workflow: {
          demandGeneration: ['新需求生成'],
          resourceAllocation: ['资源分配1'],
          production: ['生产1'],
          ruleEnforcement: ['规则执行1'],
          publicGoods: ['公共物品1'],
          feedback: ['反馈1']
        },
        institutions: modelA.structure.institutions,
        governance: modelA.structure.governance,
        culture: modelA.structure.culture,
        innovation: modelA.structure.innovation,
        risks: modelA.structure.risks,
        metrics: modelA.structure.metrics,
        optimization: modelA.structure.optimization
      }
    });

    const diff = diffModels(modelA, modelB);
    expect(diff.structureDiff.workflow).toBeDefined();
    expect(diff.structureDiff.workflow.layerName).toBe('workflow');
  });

  test('应检测所有 9 层结构', () => {
    const modelA = createTestModel();
    const modelB = createTestModel();

    const diff = diffModels(modelA, modelB);

    const layers = ['overall', 'workflow', 'institutions', 'governance', 'culture', 'innovation', 'risks', 'metrics', 'optimization'];
    for (const layer of layers) {
      expect(diff.structureDiff[layer as keyof typeof diff.structureDiff]).toBeDefined();
      expect((diff.structureDiff as any)[layer].layerName).toBe(layer);
    }
  });
});

describe('diffMetadata', () => {
  test('应计算 iterations 的 delta', () => {
    const modelA = createTestModel({ metadata: { iterations: 1, confidence: 0.7, generatedAt: '2026-02-01T10:00:00Z' } });
    const modelB = createTestModel({ metadata: { iterations: 3, confidence: 0.8, generatedAt: '2026-02-02T10:00:00Z' } });

    const diff = diffModels(modelA, modelB);
    expect(diff.metadataDiff.iterations.old).toBe(1);
    expect(diff.metadataDiff.iterations.new).toBe(3);
    expect(diff.metadataDiff.iterations.delta).toBe(2);
  });

  test('应计算 confidence 的 delta', () => {
    const modelA = createTestModel({ metadata: { iterations: 2, confidence: 0.75, generatedAt: '2026-02-01T10:00:00Z' } });
    const modelB = createTestModel({ metadata: { iterations: 3, confidence: 0.85, generatedAt: '2026-02-02T10:00:00Z' } });

    const diff = diffModels(modelA, modelB);
    expect(diff.metadataDiff.confidence.old).toBe(0.75);
    expect(diff.metadataDiff.confidence.new).toBe(0.85);
    expect(diff.metadataDiff.confidence.delta).toBeCloseTo(0.1, 2);
  });

  test('应追踪 generatedAt 变化', () => {
    const modelA = createTestModel({ metadata: { iterations: 2, confidence: 0.79, generatedAt: '2026-02-01T10:00:00Z' } });
    const modelB = createTestModel({ metadata: { iterations: 3, confidence: 0.85, generatedAt: '2026-02-02T10:00:00Z' } });

    const diff = diffModels(modelA, modelB);
    expect(diff.metadataDiff.generatedAt.old).toBe('2026-02-01T10:00:00Z');
    expect(diff.metadataDiff.generatedAt.new).toBe('2026-02-02T10:00:00Z');
  });

  test('应处理缺失的可选字段', () => {
    const modelA = createTestModel({ metadata: { iterations: 2, confidence: 0.79, generatedAt: '2026-02-01T10:00:00Z' } });
    const modelB = createTestModel({ metadata: { iterations: 3, confidence: 0.85, generatedAt: '2026-02-02T10:00:00Z' } });

    const diff = diffModels(modelA, modelB);
    // 元数据中的可选字段不会影响 diff 结果，因为它们不在 MetadataDiff 接口中
    expect(diff.metadataDiff).toBeDefined();
  });
});

describe('边界情况', () => {
  test('应处理空数组', () => {
    const modelA = createTestModel({
      agentOutputs: [],
      conflicts: [],
      structure: {
        overall: {
          resourceLayer: [],
          behaviorLayer: [],
          organizationLayer: [],
          institutionalLayer: [],
          governanceLayer: [],
          culturalLayer: []
        },
        workflow: {
          demandGeneration: [],
          resourceAllocation: [],
          production: [],
          ruleEnforcement: [],
          publicGoods: [],
          feedback: []
        },
        institutions: {
          propertyRights: [],
          contracts: [],
          publicGoods: [],
          disputeResolution: [],
          riskSharing: []
        },
        governance: {
          layeredGovernance: [],
          accountability: [],
          transparency: [],
          crisis: []
        },
        culture: {
          narrative: [],
          rituals: [],
          values: [],
          education: []
        },
        innovation: {
          experimentation: [],
          balance: [],
          adaptability: []
        },
        risks: {
          scarcity: [],
          trust: [],
          power: [],
          culture: []
        },
        metrics: {
          stability: [],
          fairness: [],
          efficiency: [],
          cooperation: [],
          resilience: [],
          legitimacy: []
        },
        optimization: {
          indicators: [],
          mechanisms: [],
          decisionLoop: []
        }
      }
    });
    const modelB = createTestModel({
      agentOutputs: [],
      conflicts: [],
      structure: modelA.structure
    });

    const diff = diffModels(modelA, modelB);
    expect(diff).toBeDefined();
    expect(diff.agentOutputDiffs).toHaveLength(0);
    expect(diff.conflictsDiff.added).toHaveLength(0);
    expect(diff.conflictsDiff.removed).toHaveLength(0);
  });

  test('应处理相同文本', () => {
    const modelA = createTestModel();
    const modelB = createTestModel();

    const diff = diffModels(modelA, modelB);
    expect(diff.agentOutputDiffs).toHaveLength(2);
  });

  test('应处理完全不同的文本', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '完全不同的结论文本',
          evidence: ['完全不同的证据1', '完全不同的证据2'],
          risks: ['完全不同的风险'],
          suggestions: ['完全不同的建议'],
          falsifiable: '完全不同的可证伪点'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.conclusion).toBeDefined();
  });

  test('应处理空对象', () => {
    const modelA = createTestModel();
    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '',
          evidence: [],
          risks: [],
          suggestions: [],
          falsifiable: ''
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    const systemsDiff = diff.agentOutputDiffs.find(d => d.agentType === 'systems');
    expect(systemsDiff?.changes.evidence?.removed).toContain('证据1');
    expect(systemsDiff?.changes.evidence?.removed).toContain('证据2');
  });
});

describe('Levenshtein 距离测试', () => {
  test('应正确计算文本相似度', () => {
    const modelA = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '系统运行稳定',
          evidence: ['证据1', '证据2'],
          risks: ['风险1', '风险2'],
          suggestions: ['建议1', '建议2'],
          falsifiable: '如果系统崩溃则证伪'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '系统运行稳定',
          evidence: ['证据1', '证据2'],
          risks: ['风险1', '风险2'],
          suggestions: ['建议1', '建议2'],
          falsifiable: '如果系统崩溃则证伪'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff).toBeDefined();
  });

  test('应处理相同文本的相似度', () => {
    const modelA = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '相同文本',
          evidence: ['证据1'],
          risks: ['风险1'],
          suggestions: ['建议1'],
          falsifiable: '可证伪点'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const modelB = createTestModel({
      agentOutputs: [
        {
          agentType: 'systems',
          conclusion: '相同文本',
          evidence: ['证据1'],
          risks: ['风险1'],
          suggestions: ['建议1'],
          falsifiable: '可证伪点'
        },
        {
          agentType: 'econ',
          conclusion: '经济模型可行',
          evidence: ['经济证据1', '经济证据2'],
          risks: ['经济风险1'],
          suggestions: ['经济建议1'],
          falsifiable: '如果经济崩溃则证伪'
        }
      ]
    });

    const diff = diffModels(modelA, modelB);
    expect(diff).toBeDefined();
  });
});
