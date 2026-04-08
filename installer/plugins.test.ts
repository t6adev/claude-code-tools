import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PluginInfo } from "./discover.js";

// Mock child_process before importing
vi.mock("child_process", () => ({
  execFileSync: vi.fn(),
}));

import { execFileSync } from "child_process";
import { installPlugin } from "./plugins.js";

const mockExecFileSync = vi.mocked(execFileSync);

beforeEach(() => {
  mockExecFileSync.mockReset();
});

describe("installPlugin", () => {
  const enabledPlugin: PluginInfo = {
    pluginId: "test-plugin",
    registry: "https://registry.example.com",
    channel: "stable",
    enabled: true,
  };

  const disabledPlugin: PluginInfo = {
    ...enabledPlugin,
    enabled: false,
  };

  it("skips disabled plugins", () => {
    const result = installPlugin(disabledPlugin, { scope: "global", dryRun: false });
    expect(result).toEqual({
      pluginId: "test-plugin",
      action: "skipped",
      reason: "disabled",
    });
    expect(mockExecFileSync).not.toHaveBeenCalled();
  });

  it("fails when claude CLI is not available", () => {
    mockExecFileSync.mockImplementation((file) => {
      if (file === "which") throw new Error("not found");
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "global", dryRun: false });
    expect(result).toEqual({
      pluginId: "test-plugin",
      action: "failed",
      reason: "claude CLI not found",
    });
  });

  it("returns installed in dry-run mode without calling claude", () => {
    // which claude succeeds
    mockExecFileSync.mockImplementation((file) => {
      if (file === "which") return Buffer.from("/usr/local/bin/claude");
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "global", dryRun: true });
    expect(result.action).toBe("installed");
    // Should only call "which" for CLI check, not "claude plugin install"
    expect(mockExecFileSync).toHaveBeenCalledTimes(1);
  });

  it("installs plugin with global scope", () => {
    mockExecFileSync.mockImplementation((file, args) => {
      if (file === "which") return Buffer.from("/usr/local/bin/claude");
      // marketplace check
      if (Array.isArray(args) && args[0] === "plugin" && args[1] === "marketplace") {
        return Buffer.from("https://registry.example.com");
      }
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "global", dryRun: false });
    expect(result.action).toBe("installed");
  });

  it("installs plugin with local scope", () => {
    mockExecFileSync.mockImplementation((file, args) => {
      if (file === "which") return Buffer.from("/usr/local/bin/claude");
      if (Array.isArray(args) && args[0] === "plugin" && args[1] === "marketplace") {
        return Buffer.from("https://registry.example.com");
      }
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "local", dryRun: false });
    expect(result.action).toBe("installed");

    // Find the plugin install call
    const installCall = mockExecFileSync.mock.calls.find(
      (call) =>
        call[0] === "claude" &&
        Array.isArray(call[1]) &&
        call[1].includes("install") &&
        call[1].includes("--scope"),
    );
    expect(installCall).toBeDefined();
    expect(installCall![1]).toContain("project");
  });

  it("registers marketplace when not already registered", () => {
    let marketplaceRegistered = false;
    mockExecFileSync.mockImplementation((file, args) => {
      if (file === "which") return Buffer.from("/usr/local/bin/claude");
      if (Array.isArray(args) && args[0] === "plugin" && args[1] === "marketplace") {
        if (args[2] === "list") {
          return Buffer.from(marketplaceRegistered ? "https://registry.example.com" : "");
        }
        if (args[2] === "add") {
          marketplaceRegistered = true;
          return Buffer.from("");
        }
      }
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "global", dryRun: false });
    expect(result.action).toBe("installed");
    expect(marketplaceRegistered).toBe(true);
  });

  it("fails when marketplace registration fails", () => {
    mockExecFileSync.mockImplementation((file, args) => {
      if (file === "which") return Buffer.from("/usr/local/bin/claude");
      if (Array.isArray(args) && args[0] === "plugin" && args[1] === "marketplace") {
        if (args[2] === "list") return Buffer.from("");
        if (args[2] === "add") throw new Error("network error");
      }
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "global", dryRun: false });
    expect(result.action).toBe("failed");
    expect(result.reason).toContain("failed to register marketplace");
  });

  it("falls back when --scope is not supported", () => {
    mockExecFileSync.mockImplementation((file, args) => {
      if (file === "which") return Buffer.from("/usr/local/bin/claude");
      if (Array.isArray(args) && args[0] === "plugin" && args[1] === "marketplace") {
        return Buffer.from("https://registry.example.com");
      }
      if (Array.isArray(args) && args.includes("--scope")) {
        const err = new Error("unknown option") as Error & { stderr: Buffer };
        err.stderr = Buffer.from("unknown option");
        throw err;
      }
      return Buffer.from("");
    });

    const result = installPlugin(enabledPlugin, { scope: "local", dryRun: false });
    expect(result.action).toBe("installed");
  });
});
