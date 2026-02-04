import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Hypothesis, AgentType } from "./types.js";
import { runWorkflow, queryAgent } from "./workflow/orchestrator.js";

const mcpServer = new McpServer({
  name: "social-modeling-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

interface ReasoningArgs {
  hypothesis: Hypothesis;
  maxIterations?: number;
}

const reasoningConfig: any = {
  description: "从基础假设推演完整的社会体系模型,通过7个专业Agent协同分析生成结构化输出",
  inputSchema: {
    type: "object",
    properties: {
      hypothesis: {
        type: "object",
        description: "基础假设,包含assumptions/constraints/goals",
        properties: {
          assumptions: { type: "array", items: { type: "string" } },
          constraints: { type: "array", items: { type: "string" } },
          goals: { type: "array", items: { type: "string" } }
        },
        required: ["assumptions", "goals"]
      },
      maxIterations: { type: "number", default: 3, minimum: 1, maximum: 10 }
    },
    required: ["hypothesis"]
  }
};

(mcpServer as any).registerTool("reasoning", reasoningConfig, async (args: ReasoningArgs, _extra?: any): Promise<any> => {
  const hypothesis: Hypothesis = args.hypothesis;
  const options = { maxIterations: args.maxIterations as number };

  console.error(`[MCP] Starting reasoning with ${hypothesis.assumptions.length} assumptions`);

  const model = await runWorkflow(hypothesis, options);

  console.error(`[MCP] Reasoning completed: ${model.agentOutputs.length} agents, ${model.conflicts.length} conflicts`);

  const response = { content: [{ type: "text" as const, text: JSON.stringify(model, null, 2) }] };
  return response as any;
});

interface QueryAgentArgs {
  agentType: AgentType;
  hypothesis: Hypothesis;
}

const queryAgentConfig: any = {
  description: "单独查询某个Agent的分析视角,获取其专业领域的深入分析",
  inputSchema: {
    type: "object",
    properties: {
      agentType: { type: "string", enum: ["systems", "econ", "socio", "governance", "culture", "risk", "validation"] },
      hypothesis: { type: "object", properties: { assumptions: { type: "array", items: { type: "string" } }, constraints: { type: "array", items: { type: "string" } }, goals: { type: "array", items: { type: "string" } } }, required: ["assumptions", "goals"] }
    },
    required: ["agentType", "hypothesis"]
  }
};

(mcpServer as any).registerTool("query_agent", queryAgentConfig, async (args: QueryAgentArgs, _extra?: any): Promise<any> => {
  const agentType = args.agentType;
  const hypothesis: Hypothesis = args.hypothesis;

  console.error(`[MCP] Querying ${agentType} agent`);

  const output = await queryAgent(agentType, hypothesis);

  console.error(`[MCP] Agent query completed`);

  return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] } as any;
});

interface ValidateModelArgs { modelJson: string }

const validateModelConfig: any = {
  description: "验证已有社会体系模型的一致性、完整性和逻辑合理性",
  inputSchema: { type: "object", properties: { modelJson: { type: "string", description: "社会体系模型的JSON字符串" } }, required: ["modelJson"] }
};

(mcpServer as any).registerTool("validate_model", validateModelConfig, async (args: ValidateModelArgs, _extra?: any): Promise<any> => {
  try {
    const model = JSON.parse(args.modelJson);

    const validation = {
      isValid: true,
      checks: {
        hasAllAgents: model.agentOutputs?.length === 7,
        hasStructure: !!model.structure,
        hasHypothesis: !!model.hypothesis,
        hasMetadata: !!model.metadata,
        agentTypesAreValid: model.agentOutputs?.every((o: any) => ["systems", "econ", "socio", "governance", "culture", "risk", "validation"].includes(o.agentType))
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

    return { content: [{ type: "text" as const, text: JSON.stringify(validation, null, 2) }] } as any;
  } catch (error) {
    return { content: [{ type: "text" as const, text: JSON.stringify({ isValid: false, error: "无效的JSON格式", details: String(error) }, null, 2) }], isError: true } as any;
  }
});

// Health check tool
// empty args type is fine; keep as Record to avoid empty-interface lint
type HealthArgs = Record<string, never>;

const healthConfig: any = {
  description: "健康检查: 返回服务运行状态,时间戳和版本(不暴露敏感信息)",
  inputSchema: { type: "object", properties: {} }
};

(mcpServer as any).registerTool("health_check", healthConfig, async (_args: HealthArgs, _extra?: any): Promise<any> => {
  try {
    const timestamp = new Date().toISOString();
    // 读取package.json中version字段
    let version = "unknown";
    try {
      // 使用 require via dynamic import style for ESM-safe read
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const pkg = JSON.parse(await (await import('fs')).promises.readFile(new URL('../package.json', import.meta.url), 'utf-8'));
      if (pkg && pkg.version) version = String(pkg.version);
    } catch (e) {
      // ignore, keep version as unknown
    }

    // Basic dependency checks (do not expose secrets)
    const checks: any = { envLoaded: false, apiKeyConfigured: false };
    // Check whether process.env has been populated (do not print values)
    checks.envLoaded = Object.keys(process.env).length > 0;
    // Detect presence of common API key variables without exposing their values
    checks.apiKeyConfigured = !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.API_KEY);

    const body = { status: "ok", timestamp, version } as any;
    // Attach a minimal boolean summary of internal checks (no values)
    body.systemChecks = {
      envLoaded: checks.envLoaded,
      apiKeyPresent: checks.apiKeyConfigured
    };

    return { content: [{ type: "text" as const, text: JSON.stringify(body) }] } as any;
  } catch (error) {
    const ts = new Date().toISOString();
    return { content: [{ type: "text" as const, text: JSON.stringify({ status: "error", timestamp: ts, message: "health check failed" }) }], isError: true } as any;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.server.connect(transport);
  console.error("[MCP] Social Modeling MCP Server running on stdio");
}

main().catch((error) => {
  console.error("[MCP] Fatal error:", error);
  process.exit(1);
});
