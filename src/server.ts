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

mcpServer.registerTool("reasoning", {
  description: "从基础假设推演完整的社会体系模型,通过7个专业Agent协同分析生成结构化输出",
  inputSchema: {
    type: "object",
    properties: {
      hypothesis: {
        type: "object",
        description: "基础假设,包含assumptions(假设列表)、constraints(约束条件)和goals(目标列表)",
        properties: {
          assumptions: {
            type: "array",
            items: { type: "string" },
            description: "假设列表,如['资源稀缺','有限理性','协作收益高']"
          },
          constraints: {
            type: "array",
            items: { type: "string" },
            description: "约束条件,如['通信成本','信息不完全','时间压力']"
          },
          goals: {
            type: "array",
            items: { type: "string" },
            description: "目标列表,如['稳定秩序','基本公平','可持续协作']"
          }
        },
        required: ["assumptions", "goals"]
      },
      maxIterations: {
        type: "number",
        description: "最大迭代次数,默认3次",
        default: 3,
        minimum: 1,
        maximum: 10
      }
    },
    required: ["hypothesis"]
  }
} as any, (async (args: ReasoningArgs): Promise<any> => {
  const hypothesis: Hypothesis = args.hypothesis;
  const options = { maxIterations: args.maxIterations as number };
  
  console.error(`[MCP] Starting reasoning with ${hypothesis.assumptions.length} assumptions`);
  
  const model = await runWorkflow(hypothesis, options);
  
  console.error(`[MCP] Reasoning completed: ${model.agentOutputs.length} agents, ${model.conflicts.length} conflicts`);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(model, null, 2)
      }
    ]
  };
}) as unknown as any);

interface QueryAgentArgs {
  agentType: AgentType;
  hypothesis: Hypothesis;
}

mcpServer.registerTool("query_agent", {
  description: "单独查询某个Agent的分析视角,获取其专业领域的深入分析",
  inputSchema: {
    type: "object",
    properties: {
      agentType: {
        type: "string",
        description: "Agent类型",
        enum: ["systems", "econ", "socio", "governance", "culture", "risk", "validation"]
      },
      hypothesis: {
        type: "object",
        description: "基础假设",
        properties: {
          assumptions: {
            type: "array",
            items: { type: "string" }
          },
          constraints: {
            type: "array",
            items: { type: "string" }
          },
          goals: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["assumptions", "goals"]
      }
    },
    required: ["agentType", "hypothesis"]
  }
} as any, (async (args: QueryAgentArgs): Promise<any> => {
  const agentType = args.agentType;
  const hypothesis: Hypothesis = args.hypothesis;
  
  console.error(`[MCP] Querying ${agentType} agent`);
  
  const output = await queryAgent(agentType, hypothesis);
  
  console.error(`[MCP] Agent query completed`);
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(output, null, 2)
      }
    ]
  };
}) as unknown as any);

interface ValidateModelArgs {
  modelJson: string;
}

mcpServer.registerTool("validate_model", {
  description: "验证已有社会体系模型的一致性、完整性和逻辑合理性",
  inputSchema: {
    type: "object",
    properties: {
      modelJson: {
        type: "string",
        description: "社会体系模型的JSON字符串"
      }
    },
    required: ["modelJson"]
  }
} as any, (async (args: ValidateModelArgs): Promise<any> => {
  try {
    const model = JSON.parse(args.modelJson);
    
    const validation = {
      isValid: true,
      checks: {
        hasAllAgents: model.agentOutputs?.length === 7,
        hasStructure: !!model.structure,
        hasHypothesis: !!model.hypothesis,
        hasMetadata: !!model.metadata,
        agentTypesAreValid: model.agentOutputs?.every((o: any) => 
          ["systems", "econ", "socio", "governance", "culture", "risk", "validation"]
            .includes(o.agentType)
        )
      },
      issues: [] as string[],
      warnings: [] as string[]
    };

    if (!validation.checks.hasAllAgents) {
      validation.issues.push("模型缺少部分Agent输出(期望7个)");
    }
    if (!validation.checks.hasStructure) {
      validation.issues.push("模型缺少结构化输出");
    }
    if (!validation.checks.agentTypesAreValid) {
      validation.issues.push("模型包含无效的Agent类型");
    }

    if (validation.issues.length > 0) {
      validation.isValid = false;
    }

    if (model.conflicts?.length > 5) {
      validation.warnings.push("检测到大量冲突,可能需要重新推演");
    }
    if (model.metadata?.confidence < 0.5) {
      validation.warnings.push("模型置信度较低,建议增加迭代次数");
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(validation, null, 2)
        }
      ]
    };
    
  } catch (error) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            isValid: false,
            error: "无效的JSON格式",
            details: String(error)
          }, null, 2)
        }
      ],
      isError: true
    };
  }
}) as unknown as any);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.server.connect(transport);
  console.error("[MCP] Social Modeling MCP Server running on stdio");
}

main().catch((error) => {
  console.error("[MCP] Fatal error:", error);
  process.exit(1);
});
