import type { 
  Hypothesis, 
  SocialSystemModel, 
  WorkflowState, 
  AgentOutput, 
  SystemStructure,
  AgentType,
  AgentFailure,
  WorkflowConfig
} from "../types";
import { createAllAgents } from "../agents/agent-factory";
import { buildErrorOutput, executeAgent } from "../agents/agent-executor";
import { detectConflicts } from "./conflict-resolver";
import { logger } from '../utils/logger.js';
import { config } from "../utils/config.js";

// Agent cache for memoization across iterations
interface AgentCacheEntry {
  agentType: AgentType;
  hypothesisHash: string;
  result: AgentOutput;
  timestamp: number;
}

const agentCache = new Map<string, AgentCacheEntry>();
const criticalAgents = new Set<AgentType>(config.CRITICAL_AGENTS as AgentType[]);

function getCacheKey(agentType: AgentType, hypothesis: Hypothesis): string {
  return `${agentType}:${JSON.stringify(hypothesis)}`;
}

export async function runWorkflow(
  hypothesis: Hypothesis,
  options: WorkflowConfig = {}
): Promise<SocialSystemModel> {
  const maxIterations = options.maxIterations ?? 3;
  const convergenceThreshold = clampConvergenceThreshold(options.convergenceThreshold ?? 0.9);

  if (!Number.isInteger(maxIterations) || maxIterations < 1) {
    throw new Error("maxIterations必须为正整数");
  }
  
  const state: WorkflowState = {
    currentStep: 1,
    iteration: 1,
    maxIterations,
    agentResults: new Map(),
    conflicts: [],
    history: [],
    failures: []
  };

  const agents = await createAllAgents();

  let previousOutputs: AgentOutput[] | null = null;

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    state.iteration = iteration;
    logger.info({ iteration, maxIterations }, `=== 迭代 ${iteration}/${maxIterations} ===`);

    await step1_ValidateHypothesis(hypothesis, state);
    await step2_ExecuteAgents(agents, hypothesis, state);
    const currentOutputs = Array.from(state.agentResults.values());
    state.conflicts = detectConflicts(Array.from(state.agentResults.values()));
    await step3_AlignConflicts(state);

    if (previousOutputs) {
      const similarity = compareOutputs(previousOutputs, currentOutputs);
      if (similarity >= convergenceThreshold) {
        logger.info(
          `✓ Workflow converged at iteration ${iteration} (similarity: ${similarity.toFixed(2)})`
        );
        const model = await step4_SynthesizeModel(hypothesis, state);
        await step5_ValidateModel(model, state);
        return model;
      }
    }
    previousOutputs = currentOutputs;

    // Add convergence check: stop early if no conflicts detected
    if (state.conflicts.length === 0) {
      logger.info(`✓ Workflow converged in ${iteration + 1} iterations (no conflicts)`);
      const model = await step4_SynthesizeModel(hypothesis, state);
      await step5_ValidateModel(model, state);
      return model;
    }

    if (iteration === maxIterations) {
      const model = await step4_SynthesizeModel(hypothesis, state);
      await step5_ValidateModel(model, state);
      return model;
    }
  }

  throw new Error("Workflow did not complete within max iterations");
}

async function step1_ValidateHypothesis(
  hypothesis: Hypothesis,
  _state: WorkflowState
): Promise<void> {
  logger.info("Step 1: 验证假设");

  if (!hypothesis.assumptions || hypothesis.assumptions.length === 0) {
    throw new Error("假设必须包含assumptions数组");
  }

  if (!hypothesis.goals || hypothesis.goals.length === 0) {
    throw new Error("假设必须包含goals数组");
  }

  logger.info({ assumptions: hypothesis.assumptions.length, goals: hypothesis.goals.length }, `✓ 假设验证通过`);
}

async function step2_ExecuteAgents(
  agents: Map<AgentType, any>,
  hypothesis: Hypothesis,
  state: WorkflowState
): Promise<void> {
  logger.info("Step 2: 并行执行Agent推演");

  const agentPromises: Promise<void>[] = [];

  for (const [agentType, agent] of agents) {
    if (!state.agentResults.has(agentType) || state.iteration > 1) {
      const cacheKey = getCacheKey(agentType, hypothesis);
      const cached = agentCache.get(cacheKey);

      if (cached && state.iteration > 1) {
        logger.info(`Using cached result for ${agentType} Agent (iteration ${state.iteration})`);
        state.agentResults.set(agentType, cached.result);
        agentPromises.push(Promise.resolve());
        continue;
      }

      const promise = executeAgent(agent, {
        hypothesis,
        previousOutputs: state.agentResults,
        iteration: state.iteration,
        conflicts: state.conflicts,
        agentType
      }).then(output => {
        state.agentResults.set(agentType, output);

        logger.info(`✓ ${agentType} Agent 完成`);
        agentCache.set(cacheKey, {
          agentType,
          hypothesisHash: JSON.stringify(hypothesis),
          result: output,
          timestamp: Date.now()
        });
      }).catch(error => {
        const message = error instanceof Error ? error.message : String(error);
        const failure: AgentFailure = {
          agentType,
          error: message,
          iteration: state.iteration,
          timestamp: new Date().toISOString()
        };
        state.failures.push(failure);
        state.agentResults.set(agentType, buildErrorOutput(agentType, error));

        logger.error({ err: message, agent: String(agentType) }, `✗ ${agentType} Agent 失败`);

        if (config.FAIL_ON_CRITICAL && criticalAgents.has(agentType)) {
          throw new Error(`Critical agent failed: ${agentType}`);
        }
      });

      agentPromises.push(promise);
    }
  }

  await Promise.all(agentPromises);
  logger.info({ completed: state.agentResults.size }, `→ 完成Agent推演`);
}

async function step3_AlignConflicts(state: WorkflowState): Promise<void> {
  logger.info("Step 3: 对齐冲突");

  if (state.conflicts.length === 0) {
    logger.info("✓ 无冲突检测到");
    return;
  }

  logger.info({ conflicts: state.conflicts.length }, `→ 检测到冲突`);
  state.conflicts.forEach((conflict, index) => {
    logger.info({ index: index + 1, type: conflict.type, severity: conflict.severity }, conflict.description);
  });

  state.history.push({
    iteration: state.iteration,
    agentOutputs: Array.from(state.agentResults.values()),
    conflicts: state.conflicts,
    timestamp: new Date().toISOString()
  });
}

async function step4_SynthesizeModel(
  hypothesis: Hypothesis,
  state: WorkflowState
): Promise<SocialSystemModel> {
  logger.info("Step 4: 合成最终模型");

  const structure = synthesizeStructure(Array.from(state.agentResults.values()));

  const model: SocialSystemModel = {
    hypothesis,
    agentOutputs: Array.from(state.agentResults.values()),
    conflicts: state.conflicts,
    structure,
    metadata: {
      iterations: state.iteration,
      confidence: calculateConfidence(state),
      generatedAt: new Date().toISOString(),
      failures: state.failures.length > 0 ? state.failures : undefined
    }
  };

  logger.info("✓ 模型合成完成");
  logger.info({ iterations: state.iteration, conflicts: state.conflicts.length, confidence: model.metadata.confidence.toFixed(2) });

  return model;
}

async function step5_ValidateModel(
  model: SocialSystemModel,
  _state: WorkflowState
): Promise<void> {
  logger.info("Step 5: 验证模型");

  const validationAgent = model.agentOutputs.find(o => o.agentType === "validation");
  
  if (validationAgent) {
    logger.info("✓ Validation Agent 输出已包含在模型中");
  } else {
    logger.warn("⚠ 警告: Validation Agent 输出缺失");
  }

  if (model.agentOutputs.length < 7) {
    logger.warn({ missing: 7 - model.agentOutputs.length }, "⚠ 警告: 缺少Agent输出");
  }

  if (model.metadata.failures && model.metadata.failures.length > 0) {
    logger.warn({ failures: model.metadata.failures.length }, "⚠ 警告: 存在Agent失败记录");
  }

  logger.info("✓ 模型验证完成");
}

function synthesizeStructure(outputs: AgentOutput[]): SystemStructure {
  return {
    overall: {
      resourceLayer: extractFromOutputs(outputs, ["资源", "材料", "工具"]),
      behaviorLayer: extractFromOutputs(outputs, ["动机", "偏好", "行为"]),
      organizationLayer: extractFromOutputs(outputs, ["组织", "小组", "层级"]),
      institutionalLayer: extractFromOutputs(outputs, ["规则", "制度", "机制"]),
      governanceLayer: extractFromOutputs(outputs, ["权力", "治理", "执行"]),
      culturalLayer: extractFromOutputs(outputs, ["文化", "认同", "价值观"])
    },
    workflow: {
      demandGeneration: extractFromOutputs(outputs, ["需求", "目标", "动机"]),
      resourceAllocation: extractFromOutputs(outputs, ["分配", "配置", "产权"]),
      production: extractFromOutputs(outputs, ["生产", "协作", "产出"]),
      ruleEnforcement: extractFromOutputs(outputs, ["执行", "惩罚", "监督"]),
      publicGoods: extractFromOutputs(outputs, ["公共品", "储备", "设施"]),
      feedback: extractFromOutputs(outputs, ["反馈", "调整", "改进"])
    },
    institutions: {
      propertyRights: extractFromOutputs(outputs, ["产权", "权利", "所有权"]),
      contracts: extractFromOutputs(outputs, ["契约", "合同", "协议"]),
      publicGoods: extractFromOutputs(outputs, ["公共品", "共享", "储备"]),
      disputeResolution: extractFromOutputs(outputs, ["争端", "仲裁", "调解"]),
      riskSharing: extractFromOutputs(outputs, ["风险", "保险", "分担"])
    },
    governance: {
      layeredGovernance: extractFromOutputs(outputs, ["分层", "层级", "结构"]),
      accountability: extractFromOutputs(outputs, ["问责", "责任", "追责"]),
      transparency: extractFromOutputs(outputs, ["透明", "公开", "监督"]),
      crisis: extractFromOutputs(outputs, ["危机", "紧急", "应急"])
    },
    culture: {
      narrative: extractFromOutputs(outputs, ["叙事", "故事", "愿景"]),
      rituals: extractFromOutputs(outputs, ["仪式", "聚会", "活动"]),
      values: extractFromOutputs(outputs, ["价值观", "价值", "信念"]),
      education: extractFromOutputs(outputs, ["教育", "学习", "传承"])
    },
    innovation: {
      experimentation: extractFromOutputs(outputs, ["试点", "试验", "探索"]),
      balance: extractFromOutputs(outputs, ["平衡", "权衡", "协调"]),
      adaptability: extractFromOutputs(outputs, ["适应", "调整", "演化"])
    },
    risks: {
      scarcity: extractFromOutputs(outputs, ["稀缺", "枯竭", "短缺"]),
      trust: extractFromOutputs(outputs, ["信任", "崩塌", "失信"]),
      power: extractFromOutputs(outputs, ["权力", "集中", "异化"]),
      culture: extractFromOutputs(outputs, ["文化", "分裂", "排斥"])
    },
    metrics: {
      stability: extractFromOutputs(outputs, ["稳定", "秩序", "和谐"]),
      fairness: extractFromOutputs(outputs, ["公平", "平等", "公正"]),
      efficiency: extractFromOutputs(outputs, ["效率", "产出", "增长"]),
      cooperation: extractFromOutputs(outputs, ["合作", "协作", "信任"]),
      resilience: extractFromOutputs(outputs, ["韧性", "恢复", "适应"]),
      legitimacy: extractFromOutputs(outputs, ["合法性", "认可", "接受"])
    },
    optimization: {
      indicators: extractFromOutputs(outputs, ["指标", "测量", "评估"]),
      mechanisms: extractFromOutputs(outputs, ["机制", "流程", "程序"]),
      decisionLoop: extractFromOutputs(outputs, ["决策", "循环", "反馈"])
    }
  };
}

function extractFromOutputs(outputs: AgentOutput[], keywords: string[]): string[] {
  const extracted: string[] = [];

  for (const output of outputs) {
    for (const suggestion of output.suggestions) {
      if (keywords.some(kw => suggestion.includes(kw))) {
        if (!extracted.includes(suggestion)) {
          extracted.push(suggestion);
        }
      }
    }
  }

  if (extracted.length === 0) {
    const fallback = outputs.find(o => 
      o.suggestions.length > 0
    )?.suggestions[0] || "未提取到具体内容";
    if (fallback && fallback !== "未提取到具体内容") {
      extracted.push(fallback);
    }
  }

  return extracted;
}

function calculateConfidence(state: WorkflowState): number {
  const agentCount = state.agentResults.size;
  const maxAgents = 7;

  const agentRatio = agentCount / maxAgents;

  const failureRatio = Math.min(1, state.failures.length / maxAgents);

  const conflictScore = state.conflicts.reduce((sum, c) => {
    const severityValue = { low: 1, medium: 2, high: 3 };
    return sum + severityValue[c.severity];
  }, 0);

  const maxConflictScore = state.agentResults.size * 3;
  const conflictRatio = 1 - (conflictScore / maxConflictScore);

  const confidence = (agentRatio * 0.6) + (conflictRatio * 0.3) + ((1 - failureRatio) * 0.1);

  return Math.max(0, Math.min(1, confidence));
}

function compareOutputs(previousOutputs: AgentOutput[], currentOutputs: AgentOutput[]): number {
  if (currentOutputs.length === 0) {
    return 0;
  }
  if (previousOutputs.length === 0) {
    return 0;
  }

  const previousByType = new Map(previousOutputs.map(output => [output.agentType, output]));
  let similaritySum = 0;

  for (const current of currentOutputs) {
    const previous = previousByType.get(current.agentType);
    if (!previous) {
      continue;
    }

    const similarity = calculateSimilarity(previous.falsifiable ?? "", current.falsifiable ?? "");
    similaritySum += similarity;
  }

  return similaritySum / currentOutputs.length;
}

function calculateSimilarity(previous: string, current: string): number {
  const previousWords = tokenizeWords(previous);
  const currentWords = tokenizeWords(current);

  if (previousWords.size === 0 || currentWords.size === 0) {
    return 0;
  }

  let intersection = 0;
  for (const word of previousWords) {
    if (currentWords.has(word)) {
      intersection += 1;
    }
  }

  const union = new Set([...previousWords, ...currentWords]).size;
  return union === 0 ? 0 : intersection / union;
}

function tokenizeWords(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/\s+/).map(word => word.trim()).filter(Boolean));
}

function clampConvergenceThreshold(value: number): number {
  if (!Number.isFinite(value)) {
    return 0.9;
  }
  return Math.max(0, Math.min(1, value));
}

export const __test__ = {
  compareOutputs,
  calculateSimilarity,
  tokenizeWords,
  clampConvergenceThreshold
};

export async function queryAgent(
  agentType: AgentType,
  hypothesis: Hypothesis,
  previousOutputs?: Map<AgentType, AgentOutput>
): Promise<AgentOutput> {
  const agents = await createAllAgents();
  const agent = agents.get(agentType);

  if (!agent) {
    throw new Error(`Agent not found: ${agentType}`);
  }

  return await executeAgent(agent, {
    hypothesis,
    previousOutputs,
    iteration: 1,
    conflicts: [],
    agentType
  });
}
