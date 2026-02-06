import { test, expect } from "bun:test";
import { createMcpServer } from "../server";

const expectedTools = ["reasoning", "query_agent", "validate_model", "health_check"];

test("MCP server registers core tools", () => {
  const server = createMcpServer();
  const toolNames = Object.keys((server as any).tools ?? {});
  const tracked = (server as any).__registeredTools ?? [];
  const names = toolNames.length > 0 ? toolNames : tracked;
  for (const tool of expectedTools) {
    expect(names).toContain(tool);
  }
});
