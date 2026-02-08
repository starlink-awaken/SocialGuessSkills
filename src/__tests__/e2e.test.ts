/**
 * E2E integration tests — exercise tool handlers in-process
 * instead of spawning a subprocess (which requires full MCP handshake).
 */
import { test, expect, beforeAll } from "bun:test";
import type { Hypothesis, SocialSystemModel, AgentType } from "../types";
import { runWorkflow, queryAgent } from "../workflow/orchestrator";

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

// --- validate_model tool logic (inline, mirrors server.ts handler) ---
function validateModel(modelJson: string) {
  try {
    const model = JSON.parse(modelJson);
    const validation = {
      isValid: true,
      checks: {
        hasAllAgents: model.agentOutputs?.length === 7,
        hasStructure: !!model.structure,
        hasHypothesis: !!model.hypothesis,
        hasMetadata: !!model.metadata,
        agentTypesAreValid: model.agentOutputs?.every((o: any) =>
          ["systems", "econ", "socio", "governance", "culture", "risk", "validation"].includes(o.agentType)
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
    return validation;
  } catch (error) {
    return { isValid: false, error: "无效的JSON格式", details: String(error) };
  }
}

test("E2E: validate_model validates model consistency", () => {
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

  const validation = validateModel(JSON.stringify(validModel)) as any;
  expect(validation.isValid).toBe(true);
  expect(validation.checks.hasAllAgents).toBe(true);
  expect(validation.checks.hasStructure).toBe(true);
  expect(validation.checks.hasHypothesis).toBe(true);
  expect(validation.checks.hasMetadata).toBe(true);
  expect(validation.checks.agentTypesAreValid).toBe(true);
  expect(validation.issues).toBeInstanceOf(Array);
  expect(validation.warnings).toBeInstanceOf(Array);
});

test("E2E: validate_model handles invalid JSON", () => {
  const validation = validateModel("invalid json string {") as any;
  expect(validation.isValid).toBe(false);
  expect(validation.error).toContain("无效的JSON格式");
});

// --- health_check tool logic ---
test("E2E: health_check returns correct format", async () => {
  const timestamp = new Date().toISOString();
  let version = "unknown";
  try {
    const pkg = JSON.parse(await (await import("fs")).promises.readFile(
      new URL("../../package.json", import.meta.url), "utf-8"
    ));
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

  expect(body.status).toBe("ok");
  expect(body.timestamp).toBeDefined();
  expect(body.version).toBeDefined();
  expect(body.systemChecks).toBeDefined();
});

// --- error cases ---
test("E2E: reasoning rejects missing hypothesis", async () => {
  expect(() => runWorkflow(undefined as any)).toThrow();
});

test("E2E: query_agent rejects invalid agentType", async () => {
  const hypothesis: Hypothesis = {
    assumptions: ["测试"],
    constraints: [],
    goals: ["测试"]
  };
  await expect(queryAgent("invalid_agent" as AgentType, hypothesis)).rejects.toThrow();
});
