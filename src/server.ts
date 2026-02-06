import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { Hypothesis, AgentType, AgentOutput } from "./types.js";
import { runWorkflow, queryAgent } from "./workflow/orchestrator.js";
import { globalTokenCounter } from "./utils/token-counter.js";
import { childLogger, logger } from "./utils/logger.js";
import { createServer as createNodeServer } from "http";
import { validateHypothesis, validateMaxIterations, validateAgentType } from "./utils/validation-schemas";
import { formatError, createSuccessResponse, ERROR_CODES } from "./utils/error-response";
import { getAllTools, getToolsByCategory } from "./agents/tools-list.js";

function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

const mcpServer = new McpServer({
  name: "social-modeling-server",
  version: "1.0.0"
}, {
  capabilities: {
    tools: {}
  }
});

const reasoningConfig: any = {
  description: "从基础假设推演完整的社会体系模型,通过7个专业Agent协同分析生成结构化输出",
  inputSchema: {
    type: "object",
    properties: {
      hypothesis: {
        type: "object",
        description: "基础假设,包含assumptions/constraints/goals",
        properties: {
          assumptions: { type: "array", items: { type: "string", properties: {} } },
          constraints: { type: "array", items: { type: "string", properties: {} } },
          goals: { type: "array", items: { type: "string", properties: {} } }
        },
        required: ["assumptions", "goals"]
      }
    }
  },
  tools: {}
};

const queryAgentConfig: any = {
  description: "单独查询某个Agent的分析视角,获取其专业领域的深入分析",
  inputSchema: {
    type: "object",
    properties: {
      agentType: {
        type: "string",
        description: "Agent类型(如systems/econ/socio等)"
      },
      hypothesis: {
        type: "object",
        description: "基础假设,包含assumptions/constraints/goals"
      }
    },
    required: ["agentType", "hypothesis"]
  },
  tools: {}
};

const validateModelConfig: any = {
  description: "验证已有社会体系模型的一致性、完整性和逻辑合理性",
  inputSchema: {
    type: "object",
    properties: {
      modelJson: {
        type: "string",
        description: "模型JSON字符串"
      }
    },
    required: ["modelJson"]
  },
  tools: {}
};

const toolsListConfig: any = {
  description: "列出所有可用的MCP tools,包括工具名称、描述和分类",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  },
  tools: {}
};

interface ReasoningArgs {
  hypothesis: Hypothesis;
  maxIterations?: number;
}

interface QueryAgentArgs {
  agentType: AgentType;
  hypothesis: Hypothesis;
}

interface ValidateModelArgs {
  modelJson: string;
}

(mcpServer as any).registerTool("reasoning", reasoningConfig, async (args: ReasoningArgs, _extra?: any): Promise<any> => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  const hypothesis: Hypothesis = args.hypothesis;
  const options = { maxIterations: args.maxIterations as number };
  
  logger.info(`[MCP][${requestId}] Starting reasoning with ${hypothesis.assumptions.length} assumptions`);
  
  const hypothesisValidation = ValidationSchemas.validateHypothesis(hypothesis);
  if (!hypothesisValidation.isValid) {
    return formatError(ERROR_CODES.VALIDATION_FAILED, hypothesisValidation.errors[0]?.message || "验证失败");
  }
  
  const iterationsValidation = ValidationSchemas.validateMaxIterations(options.maxIterations);
  if (!iterationsValidation.isValid) {
    return formatError(ERROR_CODES.VALIDATION_FAILED, iterationsValidation.errors[0]?.message || "验证失败");
  }
  
  const iterationsValidation = validateMaxIterations(options.maxIterations);
  if (!iterationsValidation.isValid) {
    return formatError("maxIterations验证失败", iterationsValidation.error);
  }
  
  const model = await runWorkflow(hypothesis, options);
  
  const duration = Date.now() - startTime;
  logger.info(`[MCP][${requestId}] Reasoning completed in ${duration}ms: ${model.agentOutputs.length} agents, ${model.conflicts.length} conflicts`);
  
  const response = createSuccessResponse(model);
  
  return response as any;
});

(mcpServer as any).registerTool("query_agent", queryAgentConfig, async (args: QueryAgentArgs, _extra?: any): Promise<any> => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const agentType = args.agentType;
  const hypothesis: Hypothesis = args.hypothesis;
  
  const agentTypeValidation = validateAgentType(agentType);
  if (!agentTypeValidation.isValid) {
    return formatError("agentType验证失败", agentTypeValidation.error);
  }
  
  const hypothesisValidation = validateHypothesis(hypothesis);
  if (!hypothesisValidation.isValid) {
    return formatError(ERROR_CODES.VALIDATION_FAILED, hypothesisValidation.errors[0]?.message || "验证失败");
  }
  
  const iterationsValidation = validateMaxIterations(options.maxIterations);
  if (!iterationsValidation.isValid) {
    return formatError(ERROR_CODES.VALIDATION_FAILED, iterationsValidation.errors[0]?.message || "验证失败");
  }
  
  logger.info(`[MCP][${requestId}] Querying ${agentType} agent`);
  
  const output = await queryAgent(agentType, hypothesis);
  
  const duration = Date.now() - startTime;
  logger.info(`[MCP][${requestId}] Agent query completed in ${duration}ms`);
  
  return { content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }] } as any;
});

(mcpServer as any).registerTool("validate_model", validateModelConfig, async (args: ValidateModelArgs, _extra?: any): Promise<any> => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    const model = JSON.parse(args.modelJson);
    
    logger.info(`[MCP][${requestId}] Validating model with ${args.modelJson.length} chars`);
    
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
    
    const duration = Date.now() - startTime;
    logger.info(`[MCP][${requestId}] Model validation completed in ${duration}ms: ${validation.issues.length} issues, ${validation.warnings.length} warnings`);
    
    return { content: [{ type: "text" as const, text: JSON.stringify(validation, null, 2) }] } as any;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.info(`[MCP][${requestId}] Model validation failed in ${duration}ms: ${String(error)}`);
    return { content: [{ type: "text" as const, text: JSON.stringify({ isValid: false, error: "无效的JSON格式", details: String(error) }, null, 2) }], isError: true } as any;
  }
});

(mcpServer as any).registerTool("tools_list", toolsListConfig, async (args: any): Promise<any> => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  logger.info(`[MCP][${requestId}] Listing available tools`);
  
  const tools = getAllTools();
  const byCategory = getToolsByCategory(tools);
  
  const response = {
    content: [{
      type: "text",
      text: JSON.stringify({
        total: tools.length,
        byCategory,
        tools
      }, null, 2)
    }]
  };
  
  const duration = Date.now() - startTime;
  logger.info(`[MCP][${requestId}] Tools list completed in ${duration}ms: ${tools.length} tools`);
  
  return response as any;
});

const healthConfig: any = {
  description: "健康检查: 返回服务运行状态、时间戳和版本(不暴露敏感信息)",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

(mcpServer as any).registerTool("health_check", healthConfig, async (_args: any, _extra?: any): Promise<any> => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  
  try {
    const timestamp = new Date().toISOString();
    let version = "unknown";
    try {
      const pkg = JSON.parse(await import('fs/promises').then(fs => fs.readFile(new URL('../package.json', import.meta.url), 'utf-8')));
      if (pkg && pkg.version) version = String(pkg.version);
    } catch {
      version = "unknown";
    }
    
    const checks: any = { envLoaded: false, apiKeyConfigured: false };
    checks.envLoaded = Object.keys(process.env).length > 0;
    checks.apiKeyConfigured = !(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.API_KEY);
    
    const body = { status: "ok", timestamp, version } as any;
    body.systemChecks = {
      envLoaded: checks.envLoaded,
      apiKeyPresent: checks.apiKeyConfigured
    };
    
    const duration = Date.now() - startTime;
    logger.info(`[MCP][${requestId}] Health check completed in ${duration}ms`);
    
    return { content: [{ type: "text" as const, text: JSON.stringify(body) }] } as any;
  } catch (error) {
    logger.error(`[MCP][${requestId}] Health check failed: ${String(error)}`);
    return { content: [{ type: "text" as const, text: JSON.stringify({ status: "error", timestamp: new Date().toISOString(), message: "Health check failed" }) }], isError: true } as any;
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.server.connect(transport);
  logger.info("[MCP] Social Modeling MCP Server running on stdio");
  
  const httpServer = createNodeServer((req, res) => {
    if (!req.url) return res.end();
    if (req.url === "/metrics") {
      res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
      
      const lines: string[] = [];
      lines.push("# HELP mcp_requests_total Total number of MCP requests processed");
      lines.push("# TYPE mcp_requests_total counter");
      
      try {
        const toolNames = Object.keys((mcpServer as any).tools ?? {});
        if (toolNames.length === 0) {
          toolNames.push("reasoning", "query_agent", "validate_model", "health_check");
        }
        for (const t of toolNames) {
          lines.push(`mcp_requests_total{tool="${t}"} 0`);
        }
      } catch {
        lines.push(`mcp_requests_total{tool="unknown"} 0`);
      }
      
      lines.push("# HELP mcp_request_duration_seconds Request duration in seconds");
      lines.push("# TYPE mcp_request_duration_seconds histogram");
      const buckets = [0.1, 0.5, 1, 2.5, 5, 10];
      for (const b of buckets) {
        lines.push(`mcp_request_duration_seconds_bucket{le="${b}"} 0`);
      }
      lines.push("mcp_request_duration_seconds_bucket{le=\"+Inf\"} 0");
      lines.push("mcp_request_duration_seconds_sum 0");
      lines.push("mcp_request_duration_seconds_count 0");
      
      try {
        const usage = globalTokenCounter.getMonthlyUsage();
        lines.push("# HELP mcp_tokens_total Total tokens consumed (monthly window)");
        lines.push("# TYPE mcp_tokens_total counter");
        lines.push(`mcp_tokens_total{type="input"} ${usage.input}`);
        lines.push(`mcp_tokens_total{type="output"} ${usage.output}`);
        
        lines.push("# HELP mcp_cost_usd_total Cumulative estimated cost in USD (monthly window)");
        lines.push("# TYPE mcp_cost_usd_total gauge");
        lines.push(`mcp_cost_usd_total ${usage.costUsd}`);
      } catch {
        lines.push("mcp_tokens_total{type=\"input\"} 0");
        lines.push("mcp_tokens_total{type=\"output\"} 0");
        lines.push("mcp_cost_usd_total 0");
      }
      
      lines.push("# HELP mcp_errors_total Total number of MCP errors");
      lines.push("# TYPE mcp_errors_total counter");
      lines.push("mcp_errors_total 0");
      
      const body = lines.join("\n") + "\n";
      res.writeHead(200);
      res.end(body);
      return;
    }
    
    if (req.url === "/") {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.writeHead(200);
      res.end(JSON.stringify({ status: "ok", server: "social-modeling-mcp", metrics: "/metrics" }));
      return;
    }
    
    res.writeHead(404);
    res.end();
  });
  
  const port = Number(process.env.PORT || 3000);
  httpServer.listen(port, () => logger.info({ msg: `HTTP metrics server listening on ${port}`, port }));
}

main().catch((error) => {
  logger.error("[MCP] Fatal error:", error);
  process.exit(1);
});
