import { execFileSync } from "child_process";
import { McpEntryInfo } from "./discover.js";

export interface McpInstallResult {
  name: string;
  action: "installed" | "skipped" | "failed";
  reason?: string;
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

  try {
    const args = ["mcp", "add"];

    // scope: both local and global use "user" scope (personal config)
    if (opts.scope === "local") {
      args.push("--scope", "project");
    } else {
      args.push("--scope", "user");
    }

    // env options
    if (entry.env) {
      for (const [key, value] of Object.entries(entry.env)) {
        args.push("--env", `${key}=${value}`);
      }
    }

    // server name
    args.push(entry.name);

    // -- command and args
    args.push("--", entry.command, ...entry.args);

    execFileSync("claude", args, { stdio: ["inherit", "inherit", "pipe"] });
    return { name: entry.name, action: "installed" };
  } catch {
    return {
      name: entry.name,
      action: "failed",
      reason: "claude mcp add command failed",
    };
  }
}
