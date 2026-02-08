/**
 * Extracted MCP tool handler functions — testable without MCP SDK.
 */
import type { Hypothesis, AgentType, SocialSystemModel } from "./types.js";
import { runWorkflow, queryAgent } from "./workflow/orchestrator.js";
import { logger } from "./utils/logger.js";
import { HypothesisRepository } from "./database/repositories/hypothesis-repository.js";
import { ModelRepository } from "./database/repositories/model-repository.js";
import { GLMCostTracker } from "./utils/glm-cost-tracker.js";
import { BudgetMonitor } from "./utils/budget-monitor.js";
import { readFileSync } from "fs";

// --- Shared response type ---
export interface ToolResponse {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
}

function textResponse(data: unknown, isError = false): ToolResponse {
  const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  const resp: ToolResponse = { content: [{ type: "text", text }] };
  if (isError) resp.isError = true;
  return resp;
}

// --- Input validation helpers ---
function validateHypothesis(h: unknown): Hypothesis {
  if (!h || typeof h !== "object") throw new Error("hypothesis 参数缺失或不是对象");
  const obj = h as Record<string, unknown>;
  if (!Array.isArray(obj.assumptions) || obj.assumptions.length === 0) {
    throw new Error("hypothesis.assumptions 必须是非空数组");
  }
  if (!Array.isArray(obj.goals) || obj.goals.length === 0) {
    throw new Error("hypothesis.goals 必须是非空数组");
  }
  return {
    assumptions: obj.assumptions as string[],
    constraints: Array.isArray(obj.constraints) ? obj.constraints as string[] : [],
    goals: obj.goals as string[]
  };
}

const VALID_AGENT_TYPES = new Set<string>([
  "systems", "econ", "socio", "governance", "culture", "risk", "validation",
  "environmental", "demographic", "infrastructure", "technology", "historical"
]);

function validateAgentType(raw: unknown): AgentType {
  if (typeof raw !== "string" || !VALID_AGENT_TYPES.has(raw)) {
    throw new Error(`无效的 agentType: ${String(raw)}。有效值: ${[...VALID_AGENT_TYPES].join(", ")}`);
  }
  return raw as AgentType;
}

// --- Tool handlers ---

export async function handleReasoning(args: Record<string, unknown>): Promise<ToolResponse> {
  const hypothesis = validateHypothesis(args.hypothesis);
  const maxIterations = typeof args.maxIterations === "number" ? args.maxIterations : undefined;

  logger.info(`[MCP] Starting reasoning with ${hypothesis.assumptions.length} assumptions`);
  const model = await runWorkflow(hypothesis, { maxIterations });
  logger.info(`[MCP] Reasoning completed: ${model.agentOutputs.length} agents, ${model.conflicts.length} conflicts`);

  return textResponse(model);
}

export async function handleQueryAgent(args: Record<string, unknown>): Promise<ToolResponse> {
  const agentType = validateAgentType(args.agentType);
  const hypothesis = validateHypothesis(args.hypothesis);

  logger.info(`[MCP] Querying ${agentType} agent`);
  const output = await queryAgent(agentType, hypothesis);
  logger.info(`[MCP] Agent query completed`);

  return textResponse(output);
}

export async function handleValidateModel(args: Record<string, unknown>): Promise<ToolResponse> {
  const modelJson = args.modelJson;
  if (typeof modelJson !== "string") {
    return textResponse({ isValid: false, error: "modelJson 参数必须是字符串" }, true);
  }

  try {
    const model = JSON.parse(modelJson);

    const validation = {
      isValid: true,
      checks: {
        hasAllAgents: model.agentOutputs?.length === 7,
        hasStructure: !!model.structure,
        hasHypothesis: !!model.hypothesis,
        hasMetadata: !!model.metadata,
        agentTypesAreValid: model.agentOutputs?.every((o: { agentType: string }) =>
          VALID_AGENT_TYPES.has(o.agentType)
        )
      },
      issues: [] as string[],
      warnings: [] as string[]
    };

    if (!validation.checks.hasAllAgents) validation.issues.push("模型缺少部分Agent输出(期望7个)");
    if (!validation.checks.hasStructure) validation.issues.push("模型缺少结构化输出");
    if (!validation.checks.agentTypesAreValid) validation.issues.push("模型包含无效的Agent类型");
    if (validation.issues.length > 0) validation.isValid = false;
    if (model.conflicts?.length > 5) validation.warnings.push("检测到大量冲突,可能需要重新推演");
    if (model.metadata?.confidence < 0.5) validation.warnings.push("模型置信度较低,建议增加迭代次数");

    return textResponse(validation);
  } catch (error) {
    return textResponse({ isValid: false, error: "无效的JSON格式", details: String(error) }, true);
  }
}

export async function handleQueryModelHistory(args: Record<string, unknown>): Promise<ToolResponse> {
  const modelRepo = new ModelRepository();
  const hypothesisRepo = new HypothesisRepository();
  let records: Array<{ modelJson: string }> = [];

  if (typeof args.hypothesisId === "number") {
    records = modelRepo.findByHypothesisId(args.hypothesisId);
  } else if (typeof args.hypothesisHash === "string") {
    const hypothesis = hypothesisRepo.findByHash(args.hypothesisHash);
    if (hypothesis) {
      records = modelRepo.findByHypothesisId(hypothesis.id);
    }
  } else if (typeof args.minConfidence === "number" && typeof args.maxConfidence === "number") {
    records = modelRepo.findByConfidenceRange(args.minConfidence, args.maxConfidence);
  } else {
    return textResponse(
      { error: "必须提供 hypothesisId/hypothesisHash 或 minConfidence/maxConfidence" },
      true
    );
  }

  const models = records
    .map((record) => {
      try { return JSON.parse(record.modelJson) as SocialSystemModel; } catch {
        logger.warn("[MCP] Failed to parse model history JSON");
        return null;
      }
    })
    .filter((m): m is SocialSystemModel => !!m);

  return textResponse(models);
}

export async function handleGetModelById(args: Record<string, unknown>): Promise<ToolResponse> {
  if (typeof args.id !== "number") {
    return textResponse({ error: "id 参数必须是数字" }, true);
  }
  const modelRepo = new ModelRepository();
  const record = modelRepo.findById(args.id);
  if (!record) {
    return textResponse({ error: `未找到ID为 ${args.id} 的模型` }, true);
  }
  return { content: [{ type: "text", text: record.modelJson }] };
}

export async function handleHealthCheck(): Promise<ToolResponse> {
  const timestamp = new Date().toISOString();
  let version = "unknown";
  try {
    const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8"));
    if (pkg?.version) version = String(pkg.version);
  } catch { /* ignore */ }

  const body = {
    status: "ok",
    timestamp,
    version,
    systemChecks: {
      envLoaded: Object.keys(process.env).length > 0,
      apiKeyPresent: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.API_KEY)
    }
  };

  return textResponse(body);
}

export async function handleGLMCostReport(args: Record<string, unknown>): Promise<ToolResponse> {
  const period = typeof args.period === "string" ? args.period : "today";
  const tracker = new GLMCostTracker();
  const monitor = new BudgetMonitor(tracker);
  const now = new Date();
  let report;
  switch (period) {
    case "today":  report = monitor.getDailyReport(now); break;
    case "week":   report = monitor.getWeeklyReport(now); break;
    case "month":  report = monitor.getMonthlyReport(now); break;
    default:       report = monitor.getDailyReport(now);
  }
  return textResponse(report);
}
