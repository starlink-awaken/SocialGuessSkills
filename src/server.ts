import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { logger } from "./utils/logger.js";
import { globalTokenCounter } from "./utils/token-counter.js";
import { createServer as createNodeServer } from "http";
import {
  handleReasoning,
  handleQueryAgent,
  handleValidateModel,
  handleQueryModelHistory,
  handleGetModelById,
  handleHealthCheck,
  handleGLMCostReport,
} from "./tool-handlers.js";

const mcpServer = new McpServer({
  name: "social-modeling-server",
  version: "1.0.0"
}, {
  capabilities: { tools: {} }
});

// --- Tool schema definitions ---

const reasoningSchema = {
  description: "从基础假设推演完整的社会体系模型,通过7个专业Agent协同分析生成结构化输出",
  inputSchema: {
    type: "object" as const,
    properties: {
      hypothesis: {
        type: "object" as const,
        description: "基础假设,包含assumptions/constraints/goals",
        properties: {
          assumptions: { type: "array" as const, items: { type: "string" as const } },
          constraints: { type: "array" as const, items: { type: "string" as const } },
          goals: { type: "array" as const, items: { type: "string" as const } }
        },
        required: ["assumptions", "goals"] as const
      },
      maxIterations: { type: "number" as const, default: 3 }
    },
    required: ["hypothesis"] as const
  }
};

const queryAgentSchema = {
  description: "单独查询某个Agent的分析视角,获取其专业领域的深入分析",
  inputSchema: {
    type: "object" as const,
    properties: {
      agentType: { type: "string" as const },
      hypothesis: {
        type: "object" as const,
        properties: {
          assumptions: { type: "array" as const, items: { type: "string" as const } },
          constraints: { type: "array" as const, items: { type: "string" as const } },
          goals: { type: "array" as const, items: { type: "string" as const } }
        },
        required: ["assumptions", "goals"] as const
      }
    },
    required: ["agentType", "hypothesis"] as const
  }
};

const validateModelSchema = {
  description: "验证已有社会体系模型的一致性、完整性和逻辑合理性",
  inputSchema: { type: "object" as const, properties: { modelJson: { type: "string" as const } }, required: ["modelJson"] as const }
};

const queryModelHistorySchema = {
  description: "查询历史模型记录: 按假设ID/哈希或置信度区间筛选",
  inputSchema: {
    type: "object" as const,
    properties: {
      hypothesisId: { type: "number" as const },
      hypothesisHash: { type: "string" as const },
      minConfidence: { type: "number" as const },
      maxConfidence: { type: "number" as const }
    }
  }
};

const getModelByIdSchema = {
  description: "通过模型ID获取完整社会体系模型",
  inputSchema: { type: "object" as const, properties: { id: { type: "number" as const } }, required: ["id"] as const }
};

const healthCheckSchema = {
  description: "健康检查: 返回服务运行状态,时间戳和版本(不暴露敏感信息)",
  inputSchema: { type: "object" as const, properties: {} }
};

const glmCostReportSchema = {
  description: "查询 GLM 成本报告(今日/本周/本月)",
  inputSchema: {
    type: "object" as const,
    properties: { period: { type: "string" as const, enum: ["today", "week", "month"] } },
    required: ["period"] as const
  }
};

// --- Register tools (SDK requires registerTool pattern) ---

type ToolRegistrar = (name: string, schema: unknown, handler: (args: Record<string, unknown>) => Promise<unknown>) => void;
const registerTool = (mcpServer as unknown as { registerTool: ToolRegistrar }).registerTool.bind(mcpServer);

registerTool("reasoning", reasoningSchema, handleReasoning);
registerTool("query_agent", queryAgentSchema, handleQueryAgent);
registerTool("validate_model", validateModelSchema, handleValidateModel);
registerTool("query_model_history", queryModelHistorySchema, handleQueryModelHistory);
registerTool("get_model_by_id", getModelByIdSchema, handleGetModelById);
registerTool("health_check", healthCheckSchema, handleHealthCheck);
registerTool("get_glm_cost_report", glmCostReportSchema, handleGLMCostReport);

// --- Main entry ---

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
  logger.info("[MCP] Social Modeling MCP Server running on stdio");

  const httpServer = createNodeServer((req, res) => {
    if (!req.url) return res.end();

    if (req.url === "/metrics") {
      res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
      const lines: string[] = [];

      lines.push("# HELP mcp_requests_total Total number of MCP requests processed");
      lines.push("# TYPE mcp_requests_total counter");
      const toolNames = ["reasoning", "query_agent", "validate_model", "health_check", "query_model_history", "get_model_by_id", "get_glm_cost_report"];
      for (const t of toolNames) {
        lines.push(`mcp_requests_total{tool="${t}"} 0`);
      }

      lines.push("# HELP mcp_request_duration_seconds Request duration in seconds");
      lines.push("# TYPE mcp_request_duration_seconds histogram");
      for (const b of [0.1, 0.5, 1, 2.5, 5, 10]) {
        lines.push(`mcp_request_duration_seconds_bucket{le="${b}"} 0`);
      }
      lines.push('mcp_request_duration_seconds_bucket{le="+Inf"} 0');
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
        lines.push('mcp_tokens_total{type="input"} 0');
        lines.push('mcp_tokens_total{type="output"} 0');
        lines.push("mcp_cost_usd_total 0");
      }

      lines.push("# HELP mcp_errors_total Total number of MCP errors");
      lines.push("# TYPE mcp_errors_total counter");
      lines.push("mcp_errors_total 0");

      res.writeHead(200);
      res.end(lines.join("\n") + "\n");
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
