import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { z } from "zod";

const MAX_TIMEOUT_MS = 600_000; // 10 minutes
const SCRIPT_NAME_RE = /^[a-zA-Z0-9_:.-]+$/;

export function createServer({ allowedProjects = [] } = {}) {
  if (allowedProjects.length === 0) {
    process.stderr.write(
      "[sandbox-runner] WARNING: ALLOWED_PROJECTS is empty. All run_script calls will be rejected.\n" +
        "Set ALLOWED_PROJECTS env var to comma-separated absolute paths.\n",
    );
  }

  const server = new McpServer({
    name: "sandbox-runner",
    version: "0.4.0",
  });

  function validateCwd(cwd) {
    const resolved = resolve(cwd);
    if (!allowedProjects.some((allowed) => resolved === resolve(allowed))) {
      return {
        ok: false,
        error: `Directory not in allow-list: ${cwd}\nAllowed: ${allowedProjects.join(", ")}`,
      };
    }
    return { ok: true, resolved };
  }

  server.registerTool(
    "run_script",
    {
      description:
        "Run a package.json script via npm. Only scripts defined in allow-listed project directories are executable.",
      inputSchema: z.object({
        script: z
          .string()
          .regex(SCRIPT_NAME_RE, "Script name must match /^[a-zA-Z0-9_:.-]+$/")
          .describe("Script name from package.json (e.g., 'e2e', 'build', 'check')"),
        cwd: z.string().describe("Project directory (must be in ALLOWED_PROJECTS)"),
        timeout_ms: z
          .number()
          .int()
          .positive()
          .max(MAX_TIMEOUT_MS)
          .default(300_000)
          .describe("Timeout in milliseconds (default: 5 min, max: 10 min)"),
      }),
    },
    async ({ script, cwd, timeout_ms }) => {
      const cwdCheck = validateCwd(cwd);
      if (!cwdCheck.ok) {
        return { content: [{ type: "text", text: cwdCheck.error }], isError: true };
      }

      let scripts;
      try {
        scripts = await loadScripts(cwdCheck.resolved);
      } catch {
        return {
          content: [
            { type: "text", text: `Error: could not read package.json in ${cwdCheck.resolved}` },
          ],
          isError: true,
        };
      }

      if (!(script in scripts)) {
        const available = Object.keys(scripts).join(", ");
        return {
          content: [
            {
              type: "text",
              text: `Error: script "${script}" not found in package.json.\nAvailable: ${available}`,
            },
          ],
          isError: true,
        };
      }

      try {
        const result = await execInDir("npm", ["run", script], {
          cwd: cwdCheck.resolved,
          timeout: timeout_ms,
        });
        return { content: [{ type: "text", text: formatOutput(script, result) }] };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Server error: ${error.message}` }],
          isError: true,
        };
      }
    },
  );

  server.registerTool(
    "list_scripts",
    {
      description: "List scripts defined in an allow-listed project's package.json.",
      inputSchema: z.object({
        cwd: z.string().describe("Project directory (must be in ALLOWED_PROJECTS)"),
      }),
    },
    async ({ cwd }) => {
      const cwdCheck = validateCwd(cwd);
      if (!cwdCheck.ok) {
        return { content: [{ type: "text", text: cwdCheck.error }], isError: true };
      }

      try {
        const scripts = await loadScripts(cwdCheck.resolved);
        const entries = Object.entries(scripts);
        if (entries.length === 0) {
          return { content: [{ type: "text", text: "No scripts found." }] };
        }
        const lines = entries.map(([name, cmd]) => `  ${name}: ${cmd}`).join("\n");
        return { content: [{ type: "text", text: lines }] };
      } catch {
        return {
          content: [
            { type: "text", text: `Error: could not read package.json in ${cwdCheck.resolved}` },
          ],
          isError: true,
        };
      }
    },
  );

  return server;
}

// --- helpers ---

async function loadScripts(cwd) {
  const raw = await readFile(join(cwd, "package.json"), "utf-8");
  const pkg = JSON.parse(raw);
  return pkg.scripts || {};
}

function execInDir(command, args, { cwd, timeout }) {
  return new Promise((resolve) => {
    execFile(
      command,
      args,
      {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024,
        env: process.env,
      },
      (error, stdout, stderr) => {
        if (error && error.killed) {
          resolve({ exitCode: null, signal: error.signal || "SIGTERM", stdout, stderr });
        } else if (error) {
          resolve({ exitCode: error.code, signal: null, stdout, stderr });
        } else {
          resolve({ exitCode: 0, signal: null, stdout, stderr });
        }
      },
    );
  });
}

function formatOutput(script, { exitCode, signal, stdout, stderr }) {
  const parts = [];

  if (exitCode === 0) {
    parts.push(`## \`npm run ${script}\`: PASSED (exit code 0)`);
  } else if (signal) {
    parts.push(`## \`npm run ${script}\`: KILLED (signal: ${signal})`);
  } else {
    parts.push(`## \`npm run ${script}\`: FAILED (exit code ${exitCode})`);
  }

  if (stdout.trim()) {
    parts.push("\n### stdout\n```\n" + stdout.trim() + "\n```");
  }

  if (stderr.trim()) {
    parts.push("\n### stderr\n```\n" + stderr.trim() + "\n```");
  }

  return parts.join("\n");
}
