import { execFileSync } from "child_process";
import { PluginInfo } from "./discover.js";

export interface PluginInstallResult {
  pluginId: string;
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

function isMarketplaceRegistered(registry: string): boolean {
  try {
    const output = execFileSync(
      "claude",
      ["plugin", "marketplace", "list"],
      { stdio: "pipe", encoding: "utf-8" }
    );
    return output.includes(registry);
  } catch {
    return false;
  }
}

function registerMarketplace(registry: string): boolean {
  try {
    execFileSync("claude", ["plugin", "marketplace", "add", registry], {
      stdio: "inherit",
    });
    return isMarketplaceRegistered(registry);
  } catch {
    return false;
  }
}

export function installPlugin(
  plugin: PluginInfo,
  opts: { scope: "local" | "global"; dryRun: boolean }
): PluginInstallResult {
  if (!plugin.enabled) {
    return { pluginId: plugin.pluginId, action: "skipped", reason: "disabled" };
  }

  if (!claudeCliAvailable()) {
    return {
      pluginId: plugin.pluginId,
      action: "failed",
      reason: "claude CLI not found",
    };
  }

  const pluginRef = `${plugin.pluginId}@${plugin.channel}`;

  if (opts.dryRun) {
    return { pluginId: plugin.pluginId, action: "installed" };
  }

  // Register marketplace if needed
  if (!isMarketplaceRegistered(plugin.registry)) {
    const registered = registerMarketplace(plugin.registry);
    if (!registered) {
      return {
        pluginId: plugin.pluginId,
        action: "failed",
        reason: `failed to register marketplace: ${plugin.registry}`,
      };
    }
  }

  try {
    const args = ["plugin", "install"];
    if (opts.scope === "local") {
      args.push("--scope", "project");
    }
    args.push(pluginRef);
    execFileSync("claude", args, { stdio: "inherit" });
    return { pluginId: plugin.pluginId, action: "installed" };
  } catch {
    return {
      pluginId: plugin.pluginId,
      action: "failed",
      reason: "install command failed",
    };
  }
}
