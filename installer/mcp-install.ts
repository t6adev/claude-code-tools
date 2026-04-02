import { execFileSync } from "child_process";
import { McpEntryInfo } from "./discover.js";

export interface McpInstallResult {
  name: string;
  action: "installed" | "updated" | "skipped" | "failed";
  reason?: string;
  previousConfig?: string;
  diff?: string;
}

interface McpConfig {
  command: string;
  args: string;
  env: string;
}

function getExistingMcpConfig(name: string): McpConfig | null {
  try {
    const output = execFileSync("claude", ["mcp", "get", name], {
      stdio: ["pipe", "pipe", "pipe"],
    }).toString();

    const get = (key: string): string => {
      const match = output.match(new RegExp(`^\\s*${key}:\\s*(.*)$`, "m"));
      return match ? match[1].trim() : "";
    };

    return {
      command: get("Command"),
      args: get("Args"),
      env: get("Environment"),
    };
  } catch {
    return null;
  }
}

function formatNewConfig(entry: McpEntryInfo): McpConfig {
  const envParts: string[] = [];
  if (entry.env) {
    for (const [key, value] of Object.entries(entry.env)) {
      envParts.push(`${key}=${value}`);
    }
  }
  return {
    command: entry.command,
    args: entry.args.join(" "),
    env: envParts.join(", "),
  };
}

function buildDiff(oldConfig: McpConfig, newConfig: McpConfig): string | null {
  const lines: string[] = [];
  for (const key of ["command", "args", "env"] as const) {
    const oldVal = oldConfig[key] || "(なし)";
    const newVal = newConfig[key] || "(なし)";
    if (oldVal !== newVal) {
      lines.push(`  ${key}: "${oldVal}" → "${newVal}"`);
    }
  }
  return lines.length > 0 ? lines.join("\n") : null;
}

function claudeCliAvailable(): boolean {
  try {
    execFileSync("which", ["claude"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function installMcp(
  entry: McpEntryInfo,
  opts: { scope: "local" | "global"; dryRun: boolean },
): McpInstallResult {
  if (!claudeCliAvailable()) {
    return {
      name: entry.name,
      action: "failed",
      reason: "claude CLI not found",
    };
  }

  if (opts.dryRun) {
    return { name: entry.name, action: "installed" };
  }

  const scopeArgs = opts.scope === "local" ? ["--scope", "project"] : ["--scope", "user"];

  function buildAddArgs(): string[] {
    const args = ["mcp", "add", ...scopeArgs];
    args.push(entry.name);
    if (entry.env) {
      for (const [key, value] of Object.entries(entry.env)) {
        args.push("-e", `${key}=${value}`);
      }
    }
    args.push("--", entry.command, ...entry.args);
    return args;
  }

  try {
    execFileSync("claude", buildAddArgs(), { stdio: ["inherit", "inherit", "pipe"] });
    return { name: entry.name, action: "installed" };
  } catch (err) {
    const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? "";

    // If the server already exists, capture old config, remove, and re-add
    if (stderr.includes("already exists")) {
      const oldConfig = getExistingMcpConfig(entry.name);
      const newConfig = formatNewConfig(entry);
      const oldConfigStr = oldConfig
        ? `Command: ${oldConfig.command}\n  Args: ${oldConfig.args}\n  Env: ${oldConfig.env || "(なし)"}`
        : null;

      try {
        execFileSync("claude", ["mcp", "remove", ...scopeArgs, entry.name], {
          stdio: ["inherit", "inherit", "pipe"],
        });
        execFileSync("claude", buildAddArgs(), { stdio: ["inherit", "inherit", "pipe"] });

        const diff = oldConfig ? buildDiff(oldConfig, newConfig) : null;
        return {
          name: entry.name,
          action: "updated",
          previousConfig: oldConfigStr ?? undefined,
          diff: diff ?? undefined,
        };
      } catch (retryErr) {
        const retryStderr = (retryErr as { stderr?: Buffer })?.stderr?.toString() ?? "";
        return {
          name: entry.name,
          action: "failed",
          reason: retryStderr.trim() || "claude mcp re-add failed after remove",
        };
      }
    }

    return {
      name: entry.name,
      action: "failed",
      reason: stderr.trim() || "claude mcp add command failed",
    };
  }
}
