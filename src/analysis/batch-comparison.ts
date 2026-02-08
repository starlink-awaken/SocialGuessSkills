import type { SocialSystemModel } from '../types.js';

export interface MetricStats {
  min: number;
  max: number;
  mean: number;
  values: number[];
}

export interface BatchComparisonResult {
  modelCount: number;
  metrics: {
    confidence: MetricStats;
    iterations: MetricStats;
    conflicts: MetricStats;
  };
  ranking: ModelRanking[];
}

export interface ModelRanking {
  modelId: string;
  rank: number;
  score: number;
  metrics: {
    confidence: number;
    iterations: number;
    conflicts: number;
  };
}

const DEFAULT_MODEL_PREFIX = 'model-';

function getModelId(model: SocialSystemModel, index: number): string {
  const metadata = model.metadata as SocialSystemModel['metadata'] & { id?: string };
  if (metadata.id && metadata.id.trim()) {
    return metadata.id;
  }

  return `${DEFAULT_MODEL_PREFIX}${index + 1}`;
}

function mean(values: number[]): number {
  if (values.length === 0) {
    throw new Error('mean requires at least one value');
  }

  const sum = values.reduce((total, value) => total + value, 0);
  return sum / values.length;
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) {
    throw new Error('standardDeviation requires at least one value');
  }

  const valuesMean = mean(values);
  const variance = mean(values.map((value) => (value - valuesMean) ** 2));
  return Math.sqrt(variance);
}

function zScore(values: number[]): number[] {
  if (values.length === 0) {
    throw new Error('zScore requires at least one value');
  }

  const valuesMean = mean(values);
  const deviation = standardDeviation(values);

  if (deviation === 0) {
    return values.map(() => 0);
  }

  return values.map((value) => (value - valuesMean) / deviation);
}

function buildStats(values: number[]): MetricStats {
  if (values.length === 0) {
    throw new Error('buildStats requires at least one value');
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
    mean: mean(values),
    values: [...values],
  };
}

export function compareModels(models: SocialSystemModel[]): BatchComparisonResult {
  if (models.length === 0) {
    throw new Error('compareModels requires at least one model');
  }

  const confidenceScores = models.map((model) => model.metadata.confidence);
  const iterationsScores = models.map((model) => model.metadata.iterations);
  const conflictsScores = models.map((model) => model.conflicts.length);

  const metrics = {
    confidence: buildStats(confidenceScores),
    iterations: buildStats(iterationsScores),
    conflicts: buildStats(conflictsScores),
  };

  const zConfidence = zScore(confidenceScores);
  const zIterations = zScore(iterationsScores);
  const zConflicts = zScore(conflictsScores);

  const ranking: ModelRanking[] = [];

  models.forEach((model, index) => {
    const score = zConfidence[index] - zIterations[index] - zConflicts[index];

    ranking.push({
      modelId: getModelId(model, index),
      rank: 0,
      score,
      metrics: {
        confidence: model.metadata.confidence,
        iterations: model.metadata.iterations,
        conflicts: model.conflicts.length,
      },
    });
  });

  ranking.sort((a, b) => b.score - a.score);
  ranking.forEach((entry, index) => {
    entry.rank = index + 1;
  });

  return {
    modelCount: models.length,
    metrics,
    ranking,
  };
}
