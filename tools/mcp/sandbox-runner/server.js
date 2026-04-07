import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./lib.js";

const server = createServer({
  allowedProjects: (process.env.ALLOWED_PROJECTS || "")
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean),
  allowedScripts: (process.env.ALLOWED_SCRIPTS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
});

const transport = new StdioServerTransport();
await server.connect(transport);
