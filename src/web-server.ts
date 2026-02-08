import type {
  Hypothesis,
  AgentOutput,
  AgentType,
  SocialSystemModel,
  SystemStructure,
  Conflict,
  WorkflowConfig,
  AnalysisContext,
} from "./types.js";
import { createAllAgents, createAgent } from "./agents/agent-factory.js";
import { executeAgent } from "./agents/agent-executor.js";
import { detectConflicts } from "./workflow/conflict-resolver.js";
import { ModelRepository } from "./database/repositories/model-repository.js";
import { HypothesisRepository } from "./database/repositories/hypothesis-repository.js";
import { logger } from "./utils/logger.js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = 3001;
const VERSION = "1.0.0";

// Agent metadata for UI
const AGENT_META: Record<
  string,
  { name: string; icon: string; color: string; priority: number; category: string }
> = {
  systems: {
    name: "系统论Agent",
    icon: "⚙️",
    color: "#3b82f6",
    priority: 3,
    category: "core",
  },
  econ: {
    name: "经济学Agent",
    icon: "📊",
    color: "#10b981",
    priority: 2,
    category: "core",
  },
  socio: {
    name: "社会学Agent",
    icon: "👥",
    color: "#8b5cf6",
    priority: 2,
    category: "core",
  },
  governance: {
    name: "治理Agent",
    icon: "🏛️",
    color: "#f59e0b",
    priority: 4,
    category: "core",
  },
  culture: {
    name: "文化Agent",
    icon: "🎭",
    color: "#ec4899",
    priority: 2,
    category: "core",
  },
  risk: {
    name: "风险Agent",
    icon: "⚠️",
    color: "#ef4444",
    priority: 5,
    category: "core",
  },
  validation: {
    name: "验证Agent",
    icon: "✅",
    color: "#06b6d4",
    priority: 1,
    category: "core",
  },
  environmental: {
    name: "环境Agent",
    icon: "🌿",
    color: "#22c55e",
    priority: 3,
    category: "extended",
  },
  demographic: {
    name: "人口Agent",
    icon: "📈",
    color: "#a855f7",
    priority: 2,
    category: "extended",
  },
  infrastructure: {
    name: "基础设施Agent",
    icon: "🏗️",
    color: "#64748b",
    priority: 3,
    category: "extended",
  },
  technology: {
    name: "技术Agent",
    icon: "💻",
    color: "#0ea5e9",
    priority: 2,
    category: "extended",
  },
  historical: {
    name: "历史Agent",
    icon: "📜",
    color: "#d97706",
    priority: 2,
    category: "extended",
  },
};

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper: Calculate similarity between iterations
function calculateSimilarity(prev: AgentOutput[], curr: AgentOutput[]): number {
  if (!prev.length || !curr.length) return 0;
  let matches = 0;
  for (const c of curr) {
    const p = prev.find((o) => o.agentType === c.agentType);
    if (p && p.conclusion === c.conclusion) matches++;
  }
  return matches / curr.length;
}

// Helper: Synthesize SystemStructure from agent outputs
function synthesizeStructure(outputs: AgentOutput[]): SystemStructure {
  const structure: SystemStructure = {
    overall: {
      resourceLayer: [],
      behaviorLayer: [],
      organizationLayer: [],
      institutionalLayer: [],
      governanceLayer: [],
      culturalLayer: [],
    },
    workflow: {
      demandGeneration: [],
      resourceAllocation: [],
      production: [],
      ruleEnforcement: [],
      publicGoods: [],
      feedback: [],
    },
    institutions: {
      propertyRights: [],
      contracts: [],
      publicGoods: [],
      disputeResolution: [],
      riskSharing: [],
    },
    governance: {
      layeredGovernance: [],
      accountability: [],
      transparency: [],
      crisis: [],
    },
    culture: {
      narrative: [],
      rituals: [],
      values: [],
      education: [],
    },
    innovation: {
      experimentation: [],
      balance: [],
      adaptability: [],
    },
    risks: {
      scarcity: [],
      trust: [],
      power: [],
      culture: [],
    },
    metrics: {
      stability: [],
      fairness: [],
      efficiency: [],
      cooperation: [],
      resilience: [],
      legitimacy: [],
    },
    optimization: {
      indicators: [],
      mechanisms: [],
      decisionLoop: [],
    },
  };

  // Aggregate evidence/suggestions/risks from all agents
  for (const output of outputs) {
    // Map agent outputs to structure layers
    const { agentType, evidence, suggestions, risks } = output;

    // Overall layers
    if (agentType === "systems") {
      structure.overall.resourceLayer.push(...evidence);
      structure.overall.organizationLayer.push(...suggestions);
    }
    if (agentType === "econ") {
      structure.overall.resourceLayer.push(...evidence);
      structure.workflow.resourceAllocation.push(...suggestions);
    }
    if (agentType === "socio") {
      structure.overall.behaviorLayer.push(...evidence);
      structure.overall.organizationLayer.push(...suggestions);
    }
    if (agentType === "governance") {
      structure.overall.governanceLayer.push(...evidence);
      structure.governance.layeredGovernance.push(...suggestions);
    }
    if (agentType === "culture") {
      structure.overall.culturalLayer.push(...evidence);
      structure.culture.values.push(...suggestions);
    }

    // Risks
    structure.risks.trust.push(...risks);

    // Metrics (extract from suggestions)
    if (suggestions.some((s) => s.includes("稳定") || s.includes("stability"))) {
      structure.metrics.stability.push(...suggestions.filter((s) => s.includes("稳定")));
    }
  }

  return structure;
}

// SSE Event Sender
class SSEStream {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController<Uint8Array> | null = null;

  constructor(controller: ReadableStreamDefaultController<Uint8Array>) {
    this.controller = controller;
  }

  send(event: string, data: unknown) {
    if (!this.controller) return;
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    this.controller.enqueue(this.encoder.encode(payload));
  }

  close() {
    if (this.controller) {
      this.controller.close();
      this.controller = null;
    }
  }
}

// Main workflow with SSE events
async function runWorkflowWithEvents(
  hypothesis: Hypothesis,
  options: WorkflowConfig = {},
  stream: SSEStream
) {
  const maxIterations = options.maxIterations ?? 3;
  const convergenceThreshold = options.convergenceThreshold ?? 0.9;
  const extendedAgents = options.extendedAgents ?? false;

  try {
    // Step 0: Workflow Start
    stream.send("workflow-start", {
      totalSteps: 6,
      maxIterations,
    });

    // Step 1: Validate Hypothesis
    stream.send("step", {
      step: 1,
      name: "验证假设",
      status: "running",
    });

    // Basic validation
    if (
      !hypothesis.assumptions?.length ||
      !hypothesis.constraints?.length ||
      !hypothesis.goals?.length
    ) {
      throw new Error("Invalid hypothesis: missing required fields");
    }

    stream.send("step", {
      step: 1,
      name: "验证假设",
      status: "completed",
    });

    // Step 2: Create Agents
    stream.send("step", {
      step: 2,
      name: "初始化Agents",
      status: "running",
    });

    const agents = await createAllAgents({ extended: extendedAgents });
    const agentTypes = Array.from(agents.keys());

    stream.send("step", {
      step: 2,
      name: "初始化Agents",
      status: "completed",
    });

    let previousOutputs: AgentOutput[] = [];
    let currentOutputs: AgentOutput[] = [];
    let conflicts: Conflict[] = [];
    let converged = false;
    let convergedAtIteration: number | undefined;
    let finalSimilarity = 0;

    // Iterative refinement
    for (let iteration = 1; iteration <= maxIterations; iteration++) {
      stream.send("iteration", {
        iteration,
        similarity: iteration > 1 ? calculateSimilarity(previousOutputs, currentOutputs) : 0,
        converged: false,
      });

      // Step 3: Execute Agents
      stream.send("step", {
        step: 3,
        name: `执行Agents (迭代 ${iteration})`,
        status: "running",
      });

      currentOutputs = [];

      for (const [agentType, agent] of agents) {
        stream.send("agent-start", {
          agentType,
          iteration,
        });

        const context: AnalysisContext = {
          hypothesis,
          previousOutputs:
            previousOutputs.length > 0
              ? new Map(previousOutputs.map((o) => [o.agentType, o]))
              : undefined,
          iteration,
          conflicts,
        };

        try {
          const output = await executeAgent(agent, context);
          currentOutputs.push(output);

          stream.send("agent-complete", {
            agentType,
            iteration,
            output,
          });
        } catch (error) {
          const errorOutput: AgentOutput = {
            agentType,
            conclusion: "执行失败",
            evidence: [],
            risks: [(error as Error).message],
            suggestions: [],
            falsifiable: "N/A",
            error: (error as Error).message,
          };
          currentOutputs.push(errorOutput);

          stream.send("agent-complete", {
            agentType,
            iteration,
            output: errorOutput,
          });
        }
      }

      stream.send("step", {
        step: 3,
        name: `执行Agents (迭代 ${iteration})`,
        status: "completed",
      });

      // Step 4: Detect Conflicts
      stream.send("step", {
        step: 4,
        name: "冲突检测",
        status: "running",
      });

      conflicts = detectConflicts(currentOutputs);

      stream.send("conflicts", {
        conflicts,
        iteration,
      });

      stream.send("step", {
        step: 4,
        name: "冲突检测",
        status: "completed",
      });

      // Check convergence
      if (iteration > 1) {
        const similarity = calculateSimilarity(previousOutputs, currentOutputs);
        finalSimilarity = similarity;

        if (similarity >= convergenceThreshold) {
          converged = true;
          convergedAtIteration = iteration;

          stream.send("iteration", {
            iteration,
            similarity,
            converged: true,
          });

          break;
        }

        stream.send("iteration", {
          iteration,
          similarity,
          converged: false,
        });
      }

      previousOutputs = [...currentOutputs];
    }

    // Step 5: Synthesize Model
    stream.send("step", {
      step: 5,
      name: "模型合成",
      status: "running",
    });

    const structure = synthesizeStructure(currentOutputs);

    stream.send("step", {
      step: 5,
      name: "模型合成",
      status: "completed",
    });

    // Step 6: Final Validation
    stream.send("step", {
      step: 6,
      name: "最终验证",
      status: "running",
    });

    const confidence = converged ? finalSimilarity : finalSimilarity * 0.8;

    const model: SocialSystemModel = {
      hypothesis,
      agentOutputs: currentOutputs,
      conflicts,
      structure,
      metadata: {
        iterations: convergedAtIteration ?? maxIterations,
        confidence,
        generatedAt: new Date().toISOString(),
        convergedAtIteration,
        finalSimilarity,
      },
    };

    stream.send("step", {
      step: 6,
      name: "最终验证",
      status: "completed",
    });

    // Save to database
    try {
      const hypothesisRepo = new HypothesisRepository();
      const modelRepo = new ModelRepository();
      const hypothesisRecord = await hypothesisRepo.save(hypothesis);
      modelRepo.save(hypothesisRecord.id, hypothesisRecord.hash, model);
    } catch (error) {
      logger.warn({ error }, "Failed to persist model to database");
    }

    // Complete
    stream.send("complete", model);
  } catch (error) {
    stream.send("error", {
      message: (error as Error).message,
    });
  } finally {
    stream.close();
  }
}

// Static file serving
function serveStaticFile(path: string): Response | null {
  const distPath = join(__dirname, "..", "web", "dist");
  let filePath = join(distPath, path === "/" ? "index.html" : path);

  // Try to read file
  try {
    const file = Bun.file(filePath);
    if (!file.size && path !== "/" && !path.includes(".")) {
      // SPA fallback: serve index.html for non-file routes
      filePath = join(distPath, "index.html");
    }

    const contentType = getContentType(filePath);
    return new Response(Bun.file(filePath), {
      headers: {
        "Content-Type": contentType,
        ...CORS_HEADERS,
      },
    });
  } catch {
    return null;
  }
}

function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    html: "text/html",
    css: "text/css",
    js: "application/javascript",
    json: "application/json",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    woff: "font/woff",
    woff2: "font/woff2",
    ttf: "font/ttf",
  };
  return types[ext || ""] || "application/octet-stream";
}

// Main server
const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS preflight
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS,
      });
    }

    // API routes
    if (path.startsWith("/api/")) {
      try {
        // GET /api/health
        if (path === "/api/health" && req.method === "GET") {
          return new Response(
            JSON.stringify({
              status: "ok",
              timestamp: new Date().toISOString(),
              version: VERSION,
            }),
            {
              headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS,
              },
            }
          );
        }

        // GET /api/agents
        if (path === "/api/agents" && req.method === "GET") {
          const agents = Object.entries(AGENT_META).map(([type, meta]) => ({
            type,
            ...meta,
          }));

          return new Response(JSON.stringify(agents), {
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          });
        }

        // POST /api/analyze - SSE streaming
        if (path === "/api/analyze" && req.method === "POST") {
          const body = (await req.json()) as {
            hypothesis: Hypothesis;
            options?: WorkflowConfig;
          };

          if (!body.hypothesis) {
            return new Response(JSON.stringify({ error: "Missing hypothesis" }), {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS,
              },
            });
          }

          const stream = new ReadableStream({
            start(controller) {
              const sseStream = new SSEStream(controller);
              runWorkflowWithEvents(body.hypothesis, body.options || {}, sseStream);
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              ...CORS_HEADERS,
            },
          });
        }

        // GET /api/history
        if (path === "/api/history" && req.method === "GET") {
          try {
            const modelRepo = new ModelRepository();
            const records = modelRepo.findAll(20);

            const models = records.map((record) => ({
              id: record.id,
              hypothesisId: record.hypothesisId,
              hash: record.hash,
              createdAt: record.createdAt,
              summary: (() => {
                try {
                  const model = JSON.parse(record.modelJson) as SocialSystemModel;
                  return {
                    iterations: model.metadata.iterations,
                    confidence: model.metadata.confidence,
                    agentCount: model.agentOutputs.length,
                    conflictCount: model.conflicts.length,
                  };
                } catch {
                  return null;
                }
              })(),
            }));

            return new Response(JSON.stringify(models), {
              headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS,
              },
            });
          } catch (error) {
            return new Response(
              JSON.stringify({
                error: "Failed to fetch history",
                message: (error as Error).message,
              }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                  ...CORS_HEADERS,
                },
              }
            );
          }
        }

        // GET /api/model/:id
        if (path.startsWith("/api/model/") && req.method === "GET") {
          const id = parseInt(path.split("/").pop() || "0", 10);

          if (!id || isNaN(id)) {
            return new Response(JSON.stringify({ error: "Invalid model ID" }), {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...CORS_HEADERS,
              },
            });
          }

          try {
            const modelRepo = new ModelRepository();
            const record = modelRepo.findById(id);

            if (!record) {
              return new Response(JSON.stringify({ error: "Model not found" }), {
                status: 404,
                headers: {
                  "Content-Type": "application/json",
                  ...CORS_HEADERS,
                },
              });
            }

            const model = JSON.parse(record.modelJson);

            return new Response(
              JSON.stringify({
                id: record.id,
                hypothesisId: record.hypothesisId,
                hash: record.hash,
                createdAt: record.createdAt,
                model,
              }),
              {
                headers: {
                  "Content-Type": "application/json",
                  ...CORS_HEADERS,
                },
              }
            );
          } catch (error) {
            return new Response(
              JSON.stringify({
                error: "Failed to fetch model",
                message: (error as Error).message,
              }),
              {
                status: 500,
                headers: {
                  "Content-Type": "application/json",
                  ...CORS_HEADERS,
                },
              }
            );
          }
        }

        // Unknown API route
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
      } catch (error) {
        logger.error({ error, path }, "API error");
        return new Response(
          JSON.stringify({
            error: "Internal server error",
            message: (error as Error).message,
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...CORS_HEADERS,
            },
          }
        );
      }
    }

    // Static file serving (production mode)
    const staticResponse = serveStaticFile(path);
    if (staticResponse) {
      return staticResponse;
    }

    // 404
    return new Response("Not Found", {
      status: 404,
      headers: CORS_HEADERS,
    });
  },
});

console.log(`🚀 SocialGuessSkills Web Server running at http://localhost:${PORT}`);
console.log(`📊 API available at http://localhost:${PORT}/api/`);
console.log(`🌐 Serving static files from web/dist/`);
console.log(`✅ CORS enabled for development (Vite on port 5173)`);

export default server;
