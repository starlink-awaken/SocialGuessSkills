import type { Hypothesis, SocialSystemModel } from '../types';
import { runWorkflow } from '../workflow/orchestrator.js';

export interface SensitivityConfig {
  baseHypothesis: Hypothesis;
  parameter: 'assumptions' | 'constraints' | 'goals';
  variations: string[][];
}

export interface SensitivityResult {
  variations: VariationResult[];
  summary: {
    confidenceRange: { min: number; max: number; mean: number };
    iterationsRange: { min: number; max: number; mean: number };
    conflictsRange: { min: number; max: number; mean: number };
  };
}

export interface VariationResult {
  variationIndex: number;
  hypothesis: Hypothesis;
  model: SocialSystemModel;
  metrics: {
    confidence: number;
    iterations: number;
    conflicts: number;
  };
}

/**
 * 执行敏感性分析
 */
export async function runSensitivityAnalysis(
  config: SensitivityConfig
): Promise<SensitivityResult> {
  const results: VariationResult[] = [];

  for (let i = 0; i < config.variations.length; i++) {
    const variation = config.variations[i];

    const hypothesis: Hypothesis = {
      ...config.baseHypothesis,
      [config.parameter]: variation
    };

    const model = await runWorkflow(hypothesis, { maxIterations: 3 });

    results.push({
      variationIndex: i,
      hypothesis,
      model,
      metrics: {
        confidence: model.metadata.confidence,
        iterations: model.metadata.iterations,
        conflicts: model.conflicts.length
      }
    });
  }

  const confidences = results.map((result) => result.metrics.confidence);
  const iterations = results.map((result) => result.metrics.iterations);
  const conflicts = results.map((result) => result.metrics.conflicts);

  return {
    variations: results,
    summary: {
      confidenceRange: {
        min: Math.min(...confidences),
        max: Math.max(...confidences),
        mean: confidences.reduce((a, b) => a + b, 0) / confidences.length
      },
      iterationsRange: {
        min: Math.min(...iterations),
        max: Math.max(...iterations),
        mean: iterations.reduce((a, b) => a + b, 0) / iterations.length
      },
      conflictsRange: {
        min: Math.min(...conflicts),
        max: Math.max(...conflicts),
        mean: conflicts.reduce((a, b) => a + b, 0) / conflicts.length
      }
    }
  };
}

/**
 * 生成参数扫描变体 (自动生成多个变体)
 */
export function generateParameterSweep(
  baseValue: string[],
  perturbations: string[]
): string[][] {
  const variations: string[][] = [];

  variations.push([...baseValue]);

  for (const perturbation of perturbations) {
    variations.push([...baseValue, perturbation]);
  }

  if (baseValue.length > 1) {
    for (let i = 0; i < baseValue.length; i++) {
      const reduced = baseValue.filter((_, index) => index !== i);
      variations.push(reduced);
    }
  }

  return variations;
}
