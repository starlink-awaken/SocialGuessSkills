import type { 
  Hypothesis, 
  SocialSystemModel, 
  WorkflowState, 
  AgentOutput, 
  Conflict,
  SystemStructure,
  AgentType
} from "../types";
import { createAllAgents } from "../agents/agent-factory";
import { executeAgent } from "../agents/agent-executor";
import { detectConflicts, suggestResolution } from "./conflict-resolver";

export async function runWorkflow(
  hypothesis: Hypothesis,
  options?: { maxIterations?: number }
): Promise<SocialSystemModel> {
  const maxIterations = options?.maxIterations ?? 3;
  
  const state: WorkflowState = {
    currentStep: 1,
    iteration: 1,
    maxIterations,
    agentResults: new Map(),
    conflicts: [],
    history: []
  };

  const agents = await createAllAgents();

  for (let iteration = 1; iteration <= maxIterations; iteration++) {
    state.iteration = iteration;

    console.log(`\n=== 迭代 ${iteration}/${maxIterations} ===`);

    await step1_ValidateHypothesis(hypothesis, state);
    await step2_ExecuteAgents(agents, hypothesis, state);
    state.conflicts = detectConflicts(Array.from(state.agentResults.values()));
    await step3_AlignConflicts(state);
    
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
  state: WorkflowState
): Promise<void> {
  console.log("Step 1: 验证假设");

  if (!hypothesis.assumptions || hypothesis.assumptions.length === 0) {
    throw new Error("假设必须包含assumptions数组");
  }

  if (!hypothesis.goals || hypothesis.goals.length === 0) {
    throw new Error("假设必须包含goals数组");
  }

  console.log(`  ✓ 假设验证通过 (${hypothesis.assumptions.length}个假设, ${hypothesis.goals.length}个目标)`);
}

async function step2_ExecuteAgents(
  agents: Map<AgentType, any>,
  hypothesis: Hypothesis,
  state: WorkflowState
): Promise<void> {
  console.log("Step 2: 并行执行Agent推演");

  const agentPromises: Promise<void>[] = [];

  for (const [agentType, agent] of agents) {
    if (!state.agentResults.has(agentType) || state.iteration > 1) {
      const promise = executeAgent(agent, {
        hypothesis,
        previousOutputs: state.agentResults,
        iteration: state.iteration,
        conflicts: state.conflicts,
        agentType
      }).then(output => {
        state.agentResults.set(agentType, output);
        console.log(`  ✓ ${agentType} Agent 完成`);
      }).catch(error => {
        console.error(`  ✗ ${agentType} Agent 失败:`, error);
      });

      agentPromises.push(promise);
    }
  }

  await Promise.all(agentPromises);
  console.log(`  → 完成Agent推演: ${state.agentResults.size}/7`);
}

async function step3_AlignConflicts(state: WorkflowState): Promise<void> {
  console.log("Step 3: 对齐冲突");

  if (state.conflicts.length === 0) {
    console.log("  ✓ 无冲突检测到");
    return;
  }

  console.log(`  → 检测到 ${state.conflicts.length} 个冲突:`);
  state.conflicts.forEach((conflict, index) => {
    console.log(`    ${index + 1}. [${conflict.type}] ${conflict.description} (${conflict.severity})`);
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
  console.log("Step 4: 合成最终模型");

  const structure = synthesizeStructure(Array.from(state.agentResults.values()));

  const model: SocialSystemModel = {
    hypothesis,
    agentOutputs: Array.from(state.agentResults.values()),
    conflicts: state.conflicts,
    structure,
    metadata: {
      iterations: state.iteration,
      confidence: calculateConfidence(state),
      generatedAt: new Date().toISOString()
    }
  };

  console.log("  ✓ 模型合成完成");
  console.log(`  → 迭代次数: ${state.iteration}`);
  console.log(`  → 冲突数量: ${state.conflicts.length}`);
  console.log(`  → 置信度: ${model.metadata.confidence.toFixed(2)}`);

  return model;
}

async function step5_ValidateModel(
  model: SocialSystemModel,
  state: WorkflowState
): Promise<void> {
  console.log("Step 5: 验证模型");

  const validationAgent = model.agentOutputs.find(o => o.agentType === "validation");
  
  if (validationAgent) {
    console.log("  ✓ Validation Agent 输出已包含在模型中");
  } else {
    console.log("  ⚠ 警告: Validation Agent 输出缺失");
  }

  if (model.agentOutputs.length < 7) {
    console.log(`  ⚠ 警告: 缺少Agent输出 (${7 - model.agentOutputs.length}/7)`);
  }

  console.log("  ✓ 模型验证完成");
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

  const conflictScore = state.conflicts.reduce((sum, c) => {
    const severityValue = { low: 1, medium: 2, high: 3 };
    return sum + severityValue[c.severity];
  }, 0);

  const maxConflictScore = state.agentResults.size * 3;
  const conflictRatio = 1 - (conflictScore / maxConflictScore);

  const confidence = (agentRatio * 0.7) + (conflictRatio * 0.3);

  return Math.max(0, Math.min(1, confidence));
}

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
