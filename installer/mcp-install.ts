import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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

function expandTilde(p: string): string {
  return p.startsWith("~/") ? path.join(os.homedir(), p.slice(2)) : p;
}

function prepareLocalMcpServer(
  entry: McpEntryInfo,
  repoMcpDir: string,
  opts: { dryRun: boolean },
): { ok: boolean; error?: string; installDir: string } {
  const installDir = path.join(os.homedir(), ".claude", "mcp-servers", entry.name);

  if (opts.dryRun) {
    return { ok: true, installDir };
  }

  fs.mkdirSync(installDir, { recursive: true });

  const srcDir = path.join(repoMcpDir, entry.serverDir);
  for (const file of entry.files ?? []) {
    const src = path.join(srcDir, file);
    const dst = path.join(installDir, file);
    if (!fs.existsSync(src)) {
      return { ok: false, error: `Source file not found: ${src}`, installDir };
    }
    fs.copyFileSync(src, dst);
  }

  try {
    execFileSync("npm", ["install", "--production"], {
      cwd: installDir,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (err) {
    const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? "";
    return { ok: false, error: `npm install failed: ${stderr}`, installDir };
  }

  return { ok: true, installDir };
}

function claudeCliAvailable(): boolean {
  try {
    execFileSync("which", ["claude"], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/**
 * 既存の ALLOWED_PROJECTS に projectDir をマージした env を返す。
 * 既に含まれている場合はそのまま返す。
 */
function mergeAllowedProjects(
  entry: McpEntryInfo,
  existingConfig: McpConfig | null,
  projectDir: string,
): Record<string, string> {
  const env = { ...entry.env };

  // 既存設定から ALLOWED_PROJECTS を取得
  let existing: string[] = [];
  if (existingConfig?.env) {
    const match = existingConfig.env.match(/ALLOWED_PROJECTS=([^,]*(?:,[^,]*)*?)(?:,\s*\w+=|$)/);
    if (match) {
      existing = match[1]
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);
    }
  }

  // マージ
  const merged = new Set(existing);
  merged.add(projectDir);
  env["ALLOWED_PROJECTS"] = [...merged].join(",");

  return env;
}

export function installMcp(
  entry: McpEntryInfo,
  opts: { scope: "local" | "global"; dryRun: boolean; repoMcpDir?: string; projectDir?: string },
): McpInstallResult {
  // Prepare local server files before MCP registration
  if (entry.local && entry.files && opts.repoMcpDir) {
    const prep = prepareLocalMcpServer(entry, opts.repoMcpDir, {
      dryRun: opts.dryRun,
    });
    if (!prep.ok) {
      return { name: entry.name, action: "failed", reason: prep.error };
    }
  }

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

  function buildAddArgs(env: Record<string, string> | undefined): string[] {
    const args = ["mcp", "add", ...scopeArgs];
    args.push(entry.name);
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        args.push("-e", `${key}=${value}`);
      }
    }
    args.push("--", entry.command, ...entry.args.map(expandTilde));
    return args;
  }

  // 初回: projectDir があれば ALLOWED_PROJECTS に設定
  const initialEnv =
    opts.projectDir && entry.env && "ALLOWED_PROJECTS" in entry.env
      ? { ...entry.env, ALLOWED_PROJECTS: opts.projectDir }
      : entry.env;

  try {
    execFileSync("claude", buildAddArgs(initialEnv), { stdio: ["inherit", "inherit", "pipe"] });
    return { name: entry.name, action: "installed" };
  } catch (err) {
    const stderr = (err as { stderr?: Buffer })?.stderr?.toString() ?? "";

    // If the server already exists, capture old config, merge env, remove, and re-add
    if (stderr.includes("already exists")) {
      const oldConfig = getExistingMcpConfig(entry.name);

      // projectDir があれば既存の ALLOWED_PROJECTS にマージ
      const mergedEnv =
        opts.projectDir && entry.env && "ALLOWED_PROJECTS" in entry.env
          ? mergeAllowedProjects(entry, oldConfig, opts.projectDir)
          : entry.env;

      const newConfig = formatNewConfig({ ...entry, env: mergedEnv });
      const oldConfigStr = oldConfig
        ? `Command: ${oldConfig.command}\n  Args: ${oldConfig.args}\n  Env: ${oldConfig.env || "(なし)"}`
        : null;

      try {
        execFileSync("claude", ["mcp", "remove", ...scopeArgs, entry.name], {
          stdio: ["inherit", "inherit", "pipe"],
        });
        execFileSync("claude", buildAddArgs(mergedEnv), { stdio: ["inherit", "inherit", "pipe"] });

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
