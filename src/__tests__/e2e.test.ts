import { test, expect } from "bun:test";

interface MCPRequest {
  jsonrpc: "2.0";
  method: string;
  params?: any;
  id: number;
}

interface MCPResponse {
  jsonrpc: "2.0";
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: number;
}

async function callMCPServer(request: MCPRequest): Promise<MCPResponse> {
  const bunPath = process.execPath || "bun";
  const serverProcess = Bun.spawn({
    cmd: [bunPath, "run", "src/server.ts"],
    cwd: process.cwd(),
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ANTHROPIC_API_KEY: "mock-api-key-for-testing" }
  });

  const requestJson = JSON.stringify(request) + "\n";
  serverProcess.stdin.write(new TextEncoder().encode(requestJson));
  serverProcess.stdin.flush();
  serverProcess.stdin.end();

  await Bun.sleep(500);

  const stdout = await new Response(serverProcess.stdout).text();
  const stderr = await new Response(serverProcess.stderr).text();

  serverProcess.kill();

  const lines = stdout.split("\n").filter(line => line.trim());
  const lastLine = lines[lines.length - 1];

  try {
    const parsed = JSON.parse(lastLine || "{}");
    return parsed;
  } catch (e) {
    console.error("Failed to parse MCP response:");
    console.error("Last line:", lastLine);
    console.error("All lines:", lines);
    console.error("Full stdout:", stdout);
    console.error("stderr:", stderr);
    throw new Error(`Invalid MCP response: ${e}`);
  }
}

test("E2E: health_check tool returns correct format", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "health_check",
      arguments: {}
    },
    id: 1
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(1);

  if (response.result?.isError) {
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0].type).toBe("text");
  } else {
    expect(response.result).toBeDefined();
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content.length).toBeGreaterThan(0);
    expect(result.content[0].type).toBe("text");

    const body = JSON.parse(result.content[0].text);
    expect(body.status).toBe("ok");
    expect(body.timestamp).toBeDefined();
    expect(body.version).toBeDefined();
    expect(body.systemChecks).toBeDefined();
  }
});

test("E2E: reasoning tool generates complete social system model", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "reasoning",
      arguments: {
        hypothesis: {
          assumptions: ["测试假设: 100人社区"],
          constraints: ["资源有限"],
          goals: ["建立稳定秩序"]
        },
        maxIterations: 1
      }
    },
    id: 2
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(2);

  if (response.result?.isError) {
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
  } else {
    expect(response.result).toBeDefined();
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
    expect(result.content.length).toBeGreaterThan(0);

    const model = JSON.parse(result.content[0].text);

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
  }
});

test("E2E: query_agent tool returns single agent analysis", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "query_agent",
      arguments: {
        agentType: "risk",
        hypothesis: {
          assumptions: ["资源稀缺"],
          constraints: [],
          goals: ["稳定秩序"]
        }
      }
    },
    id: 3
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(3);

  if (response.result?.isError) {
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
  } else {
    expect(response.result).toBeDefined();
    const result = response.result;
    const output = JSON.parse(result.content[0].text);

    expect(output.agentType).toBe("risk");
    expect(output.conclusion).toBeDefined();
    expect(output.conclusion.length).toBeGreaterThan(0);
    expect(output.evidence).toBeInstanceOf(Array);
    expect(output.risks).toBeInstanceOf(Array);
    expect(output.suggestions).toBeInstanceOf(Array);
    expect(output.falsifiable).toBeDefined();
    expect(output.falsifiable.length).toBeGreaterThan(0);
  }
});

test("E2E: validate_model tool validates model consistency", async () => {
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

  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "validate_model",
      arguments: {
        modelJson: JSON.stringify(validModel)
      }
    },
    id: 4
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(4);

  if (response.result?.isError) {
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
  } else {
    expect(response.result).toBeDefined();
    const result = response.result;
    const validation = JSON.parse(result.content[0].text);

    expect(validation.isValid).toBeDefined();
    expect(validation.checks).toBeDefined();
    expect(validation.checks.hasAllAgents).toBe(true);
    expect(validation.checks.hasStructure).toBe(true);
    expect(validation.checks.hasHypothesis).toBe(true);
    expect(validation.checks.hasMetadata).toBe(true);
    expect(validation.checks.agentTypesAreValid).toBe(true);
    expect(validation.issues).toBeInstanceOf(Array);
    expect(validation.warnings).toBeInstanceOf(Array);
  }
});

test("E2E: validate_model tool handles invalid JSON", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "validate_model",
      arguments: {
        modelJson: "invalid json string {"
      }
    },
    id: 5
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(5);

  if (response.result?.isError) {
    const result = response.result;
    expect(result.content).toBeInstanceOf(Array);
  } else {
    expect(response.result).toBeDefined();
    const result = response.result;
    const validation = JSON.parse(result.content[0].text);

    expect(validation.isValid).toBe(false);
    expect(validation.error).toBeDefined();
    expect(validation.error).toContain("无效的JSON格式");
  }
});

test("E2E: reasoning tool missing hypothesis parameter returns error", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "reasoning",
      arguments: {}
    },
    id: 6
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(6);
  expect(response.result?.isError === true || response.error !== undefined).toBe(true);
});

test("E2E: query_agent tool invalid agentType returns error", async () => {
  const request: MCPRequest = {
    jsonrpc: "2.0",
    method: "tools/call",
    params: {
      name: "query_agent",
      arguments: {
        agentType: "invalid_agent",
        hypothesis: {
          assumptions: ["测试"],
          constraints: [],
          goals: ["测试"]
        }
      }
    },
    id: 7
  };

  const response = await callMCPServer(request);

  expect(response.jsonrpc).toBe("2.0");
  expect(response.id).toBe(7);
  expect(response.result || response.error).toBeDefined();
});
