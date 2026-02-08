import { McpServer } from "../node_modules/@modelcontextprotocol/sdk/dist/esm/server/mcp.js";

const server = new McpServer({ name: "test-server", version: "1.0.0" });
console.log(server);