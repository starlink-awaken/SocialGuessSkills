import { StdioServerTransport } from "../node_modules/@modelcontextprotocol/sdk/dist/esm/server/stdio.js";

const transport = new StdioServerTransport();
console.log(transport);