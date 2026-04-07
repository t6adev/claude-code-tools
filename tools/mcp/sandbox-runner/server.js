import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./lib.js";

const server = createServer({
  allowedProjects: (process.env.ALLOWED_PROJECTS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean),
});

const transport = new StdioServerTransport();
await server.connect(transport);
