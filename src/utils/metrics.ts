import { Counter, Gauge, Histogram, Registry } from "prom-client";

export const register = new Registry();

const durationBuckets = [0.1, 0.5, 1, 2, 5, 10, 30];

export const mcpRequestTotal = new Counter({
  name: "mcp_request_total",
  help: "Total count of MCP requests handled.",
  registers: [register],
});

export const mcpRequestDuration = new Histogram({
  name: "mcp_request_duration_seconds",
  help: "Duration of MCP requests in seconds.",
  buckets: durationBuckets,
  registers: [register],
});

export const agentExecutionTotal = new Counter({
  name: "agent_execution_total",
  help: "Total number of agent executions.",
  registers: [register],
});

export const agentExecutionDuration = new Histogram({
  name: "agent_execution_duration_seconds",
  help: "Duration of agent executions in seconds.",
  buckets: durationBuckets,
  registers: [register],
});

export const glmApiCallsTotal = new Counter({
  name: "glm_api_calls_total",
  help: "Total number of GLM API calls.",
  registers: [register],
});

export const glmApiTokensUsed = new Counter({
  name: "glm_api_tokens_used_total",
  help: "Total GLM API tokens consumed.",
  registers: [register],
});

export const glmApiCostUsd = new Counter({
  name: "glm_api_cost_usd_total",
  help: "Total GLM API cost in USD.",
  registers: [register],
});

export const glmApiDuration = new Histogram({
  name: "glm_api_duration_seconds",
  help: "Duration of GLM API calls in seconds.",
  buckets: durationBuckets,
  registers: [register],
});

export const workflowIterationsTotal = new Counter({
  name: "workflow_iterations_total",
  help: "Total number of workflow iterations executed.",
  registers: [register],
});

export const workflowConfidence = new Gauge({
  name: "workflow_confidence",
  help: "Confidence score of the workflow output.",
  registers: [register],
});

export const workflowConflictsDetected = new Counter({
  name: "workflow_conflicts_detected_total",
  help: "Total number of workflow conflicts detected.",
  registers: [register],
});

export const workflowDurationSeconds = new Histogram({
  name: "workflow_duration_seconds",
  help: "Duration of workflow execution in seconds.",
  buckets: durationBuckets,
  registers: [register],
});

export const systemMemoryUsageBytes = new Gauge({
  name: "system_memory_usage_bytes",
  help: "Current system memory usage in bytes.",
  registers: [register],
});

export const systemCpuUsagePercent = new Gauge({
  name: "system_cpu_usage_percent",
  help: "Current system CPU usage percentage.",
  registers: [register],
});
