/**
 * Model Diff 算法
 * 实现两个 SocialSystemModel 之间的结构化差异对比
 * 
 * @module src/analysis/model-diff
 * @see Phase 3 计划第 260-310 行
 */

import type { SocialSystemModel } from "../types.js";

export interface TextDiff {
  old: string;
  new: string;
  similarity: number; // 0-1, Levenshtein 距离
}

export interface ArrayDiff<T> {
  added: T[];
  removed: T[];
  unchanged: T[];
}

export interface AgentOutputDiff {
  agentType: string;
  changes: {
    conclusion?: TextDiff;
    evidence?: ArrayDiff<string>;
    risks?: ArrayDiff<string>;
    suggestions?: ArrayDiff<string>;
    falsifiable?: TextDiff;
  };
}

export interface ConflictsDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export interface StructureDiff {
  overall: LayerDiff;
  workflow: LayerDiff;
  institutions: LayerDiff;
  governance: LayerDiff;
  culture: LayerDiff;
  innovation: LayerDiff;
  risks: LayerDiff;
  metrics: LayerDiff;
  optimization: LayerDiff;
}

export interface LayerDiff {
  layerName: string;
  changes: Record<string, ArrayDiff<string>>;
}

export interface MetadataDiff {
  iterations: { old: number; new: number; delta: number };
  confidence: { old: number; new: number; delta: number };
  generatedAt: { old: string; new: string };
}

export interface ModelDiff {
  summary: {
    totalChanges: number;
    addedFields: number;
    removedFields: number;
    modifiedFields: number;
  };
  agentOutputDiffs: AgentOutputDiff[];
  conflictsDiff: ConflictsDiff;
  structureDiff: StructureDiff;
  metadataDiff: MetadataDiff;
}

/**
 * 对比两个模型,生成差异报告
 */
export function diffModels(modelA: SocialSystemModel, modelB: SocialSystemModel): ModelDiff {
  return {
    summary: computeSummary(modelA, modelB),
    agentOutputDiffs: diffAgentOutputs(modelA.agentOutputs, modelB.agentOutputs),
    conflictsDiff: diffConflicts(modelA.conflicts, modelB.conflicts),
    structureDiff: diffStructure(modelA.structure, modelB.structure),
    metadataDiff: diffMetadata(modelA.metadata, modelB.metadata)
  };
}

/**
 * 计算总体变化统计
 */
function computeSummary(modelA: SocialSystemModel, modelB: SocialSystemModel): ModelDiff['summary'] {
  let totalChanges = 0;
  let addedFields = 0;
  let removedFields = 0;
  let modifiedFields = 0;

  // Agent 输出变化
  for (const agentA of modelA.agentOutputs) {
    const agentB = modelB.agentOutputs.find(b => b.agentType === agentA.agentType);
    if (!agentB) continue;

    if (agentA.conclusion !== agentB.conclusion) modifiedFields++;
    if (agentA.falsifiable !== agentB.falsifiable) modifiedFields++;

    const evidenceDiff = diffArray(agentA.evidence, agentB.evidence);
    addedFields += evidenceDiff.added.length;
    removedFields += evidenceDiff.removed.length;
    modifiedFields += evidenceDiff.unchanged.length;

    const risksDiff = diffArray(agentA.risks, agentB.risks);
    addedFields += risksDiff.added.length;
    removedFields += risksDiff.removed.length;
    modifiedFields += risksDiff.unchanged.length;

    const suggestionsDiff = diffArray(agentA.suggestions, agentB.suggestions);
    addedFields += suggestionsDiff.added.length;
    removedFields += suggestionsDiff.removed.length;
    modifiedFields += suggestionsDiff.unchanged.length;
  }

  // 冲突变化
  const conflictsDiff = diffConflicts(modelA.conflicts, modelB.conflicts);
  addedFields += conflictsDiff.added.length;
  removedFields += conflictsDiff.removed.length;
  modifiedFields += conflictsDiff.unchanged.length;

  totalChanges = addedFields + removedFields + modifiedFields;
  totalChanges = addedFields + removedFields + modifiedFields;

  return { totalChanges, addedFields, removedFields, modifiedFields };
}

/**
 * 对比 Agent 输出
 */
function diffAgentOutputs(outputsA: any[], outputsB: any[]): AgentOutputDiff[] {
  const diffs: AgentOutputDiff[] = [];

  for (const agentA of outputsA) {
    const agentB = outputsB.find(b => b.agentType === agentA.agentType);
    if (!agentB) continue;

    const conclusion = diffText(agentA.conclusion, agentB.conclusion);
    const evidence = diffArray<string>(agentA.evidence, agentB.evidence);
    const risks = diffArray<string>(agentA.risks, agentB.risks);
    const suggestions = diffArray<string>(agentA.suggestions, agentB.suggestions);
    const falsifiable = diffText(agentA.falsifiable, agentB.falsifiable);

    diffs.push({
      agentType: agentA.agentType,
      changes: {
        conclusion,
        evidence,
        risks,
        suggestions,
        falsifiable
      }
    });
  }

  return diffs;
}

/**
 * 对比冲突列表
 */
function diffConflicts(conflictsA: any[], conflictsB: any[]): ConflictsDiff {
  const descriptionsA = conflictsA.map(c => c.description);
  const descriptionsB = conflictsB.map(c => c.description);

  const added = descriptionsB.filter(d => !descriptionsA.includes(d));
  const removed = descriptionsA.filter(d => !descriptionsB.includes(d));
  const unchanged = descriptionsA.filter(d => descriptionsB.includes(d));

  return { added, removed, unchanged };
}

/**
 * 对比数组 (集合差异)
 */
function diffArray<T>(arrayA: T[], arrayB: T[]): ArrayDiff<T> {
  const setA = new Set(arrayA);
  const setB = new Set(arrayB);

  const added = arrayB.filter(item => !setA.has(item));
  const removed = arrayA.filter(item => !setB.has(item));
  const unchanged = arrayA.filter(item => setB.has(item));

  return { added, removed, unchanged };
}

/**
 * 对比文本 - Levenshtein 距离算法
 */
function diffText(textA: string, textB: string): TextDiff {
  const distance = levenshteinDistance(textA, textB);
  const maxLength = Math.max(textA.length, textB.length);
  const similarity = maxLength === 0 ? 1.0 : 1.0 - distance / maxLength;
  return { old: textA, new: textB, similarity };
}

/**
 * Levenshtein 距离算法
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const lenA = a.length;
  const lenB = b.length;

  // 初始化矩阵
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a.charAt(j - 1) === b.charAt(i - 1) ? 0 : 1;

      matrix[i]![j] = Math.min(
        matrix[i - 1]![j - 1]! + cost,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j]! + 1
      );
    }
  }

  return matrix[b.length]![a.length]!;
}

/**
 * 对比 9 层结构
 */
function diffStructure(structureA: any, structureB: any): StructureDiff {
  const layers = ['overall', 'workflow', 'institutions', 'governance', 'culture', 'innovation', 'risks', 'metrics', 'optimization'] as const;
  const structureDiff: any = {};

  for (const layer of layers) {
    const layerA = structureA[layer];
    const layerB = structureB[layer];

    const changes: Record<string, ArrayDiff<string>> = {};
    if (Array.isArray(layerA) && Array.isArray(layerB)) {
      for (const key in layerA) {
        if (Array.isArray(layerB[key]) && Array.isArray(layerB[key])) {
          const arrayDiff = diffArray(layerA[key], layerB[key]);
          changes[key] = arrayDiff;
        }
      }
    }

    structureDiff[layer] = {
      layerName: layer,
      changes
    };
  }

  return structureDiff;
}

/**
 * 对比元数据
 */
function diffMetadata(metadataA: any, metadataB: any): MetadataDiff {
  return {
    iterations: {
      old: metadataA.iterations || 0,
      new: metadataB.iterations || 0,
      delta: metadataB.iterations - (metadataA.iterations || 0)
    },
    confidence: {
      old: metadataA.confidence || 0,
      new: metadataB.confidence || 0,
      delta: metadataB.confidence - (metadataA.confidence || 0)
    },
    generatedAt: {
      old: metadataA.generatedAt || "",
      new: metadataB.generatedAt || ""
    }
  };
}
