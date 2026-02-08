/**
 * E2E integration tests — exercise tool handlers in-process
 * instead of spawning a subprocess (which requires full MCP handshake).
 */
import { test, expect, beforeAll } from "bun:test";
import type { Hypothesis, AgentType } from "../types";
import { runWorkflow, queryAgent } from "../workflow/orchestrator";
import {
  handleValidateModel,
  handleHealthCheck,
  handleReasoning,
  handleQueryAgent,
} from "../tool-handlers";

// Set test env so DB uses :memory:
beforeAll(() => {
  process.env.NODE_ENV = "test";
  process.env.AGENT_MOCK_MODE = "1";
});

// --- reasoning tool logic ---
test("E2E: reasoning produces complete social system model", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试假设: 100人社区"],
    constraints: ["资源有限"],
    goals: ["建立稳定秩序"]
  };

  const model = await runWorkflow(hypothesis, { maxIterations: 1 });

  expect(model.agentOutputs).toBeInstanceOf(Array);
  expect(model.agentOutputs.length).toBe(7);
  expect(model.conflicts).toBeInstanceOf(Array);
  expect(model.structure).toBeDefined();
  expect(model.metadata).toBeDefined();
  expect(model.metadata.iterations).toBeGreaterThan(0);
  expect(model.metadata.confidence).toBeGreaterThan(0);
  expect(model.metadata.confidence).toBeLessThanOrEqual(1);
  expect(model.metadata.generatedAt).toBeDefined();

  expect(model.structure.overall).toBeDefined();
  expect(model.structure.workflow).toBeDefined();
  expect(model.structure.institutions).toBeDefined();
  expect(model.structure.governance).toBeDefined();
  expect(model.structure.culture).toBeDefined();
  expect(model.structure.innovation).toBeDefined();
  expect(model.structure.risks).toBeDefined();
  expect(model.structure.metrics).toBeDefined();
  expect(model.structure.optimization).toBeDefined();
}, 15_000);

// --- query_agent tool logic ---
test("E2E: query_agent returns single agent analysis", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["资源稀缺"],
    constraints: [],
    goals: ["稳定秩序"]
  };

  const output = await queryAgent("risk" as AgentType, hypothesis);

  expect(output.agentType).toBe("risk");
  expect(output.conclusion).toBeDefined();
  expect(output.conclusion.length).toBeGreaterThan(0);
  expect(output.evidence).toBeInstanceOf(Array);
  expect(output.risks).toBeInstanceOf(Array);
  expect(output.suggestions).toBeInstanceOf(Array);
  expect(output.falsifiable).toBeDefined();
  expect(output.falsifiable.length).toBeGreaterThan(0);
}, 10_000);

// --- validate_model tool handler (via extracted handler) ---
test("E2E: validate_model validates model consistency", async () => {
  const validModel = {
    agentOutputs: Array(7).fill(null).map((_, i) => ({
      agentType: ["systems", "econ", "socio", "governance", "culture", "risk", "validation"][i],
      conclusion: "测试结论",
      evidence: [],
      risks: [],
      suggestions: [],
      falsifiable: "测试可证伪点"
    })),
    conflicts: [],
    structure: { overall: {}, workflow: {} },
    hypothesis: { assumptions: [], constraints: [], goals: [] },
    metadata: { iterations: 1, confidence: 0.8, generatedAt: new Date().toISOString() }
  };

  const response = await handleValidateModel({ modelJson: JSON.stringify(validModel) });
  const validation = JSON.parse(response.content[0]?.text ?? "{}");
  expect(validation.isValid).toBe(true);
  expect(validation.checks.hasAllAgents).toBe(true);
  expect(validation.checks.hasStructure).toBe(true);
  expect(validation.checks.hasHypothesis).toBe(true);
  expect(validation.checks.hasMetadata).toBe(true);
  expect(validation.checks.agentTypesAreValid).toBe(true);
  expect(validation.issues).toBeInstanceOf(Array);
  expect(validation.warnings).toBeInstanceOf(Array);
});

test("E2E: validate_model handles invalid JSON", async () => {
  const response = await handleValidateModel({ modelJson: "invalid json string {" });
  const validation = JSON.parse(response.content[0]?.text ?? "{}");
  expect(validation.isValid).toBe(false);
  expect(validation.error).toContain("无效的JSON格式");
});

// --- health_check via extracted handler ---
test("E2E: health_check returns correct format", async () => {
  const response = await handleHealthCheck();
  const body = JSON.parse(response.content[0]?.text ?? "{}");

  expect(body.status).toBe("ok");
  expect(body.timestamp).toBeDefined();
  expect(body.version).toBeDefined();
  expect(body.systemChecks).toBeDefined();
});

// --- error cases via extracted handlers ---
test("E2E: reasoning rejects missing hypothesis", async () => {
  await expect(handleReasoning({})).rejects.toThrow("hypothesis");
});

test("E2E: query_agent rejects invalid agentType", async () => {
  await expect(handleQueryAgent({
    agentType: "invalid_agent",
    hypothesis: { assumptions: ["测试"], constraints: [], goals: ["测试"] }
  })).rejects.toThrow("无效的 agentType");
});
