import { describe, it, expect } from "vitest";
import {
  parseEnvValue,
  mergeAllowedProjects,
  mergeAllowedScripts,
  formatNewConfig,
  buildDiff,
  type McpConfig,
} from "./mcp-install.js";
import type { McpEntryInfo } from "./discover.js";

describe("parseEnvValue", () => {
  it("parses a single value", () => {
    expect(parseEnvValue("ALLOWED_PROJECTS=/home/user/proj", "ALLOWED_PROJECTS")).toEqual([
      "/home/user/proj",
    ]);
  });

  it("parses comma-separated values", () => {
    expect(parseEnvValue("ALLOWED_PROJECTS=/proj1,/proj2,/proj3", "ALLOWED_PROJECTS")).toEqual([
      "/proj1",
      "/proj2",
      "/proj3",
    ]);
  });

  it("parses a key from a multi-key env string", () => {
    expect(
      parseEnvValue(
        "ALLOWED_PROJECTS=/proj1,/proj2, ALLOWED_SCRIPTS=test,build",
        "ALLOWED_PROJECTS",
      ),
    ).toEqual(["/proj1", "/proj2"]);
  });

  it("parses ALLOWED_SCRIPTS from a multi-key env string", () => {
    expect(
      parseEnvValue("ALLOWED_PROJECTS=/proj1, ALLOWED_SCRIPTS=test,build", "ALLOWED_SCRIPTS"),
    ).toEqual(["test", "build"]);
  });

  it("returns empty array when key is not found", () => {
    expect(parseEnvValue("OTHER_KEY=value", "ALLOWED_PROJECTS")).toEqual([]);
  });

  it("returns empty array for empty string", () => {
    expect(parseEnvValue("", "ALLOWED_PROJECTS")).toEqual([]);
  });
});

describe("mergeAllowedProjects", () => {
  const baseEntry: McpEntryInfo = {
    serverDir: "test-server",
    name: "test",
    command: "node",
    args: ["server.js"],
    env: { ALLOWED_PROJECTS: "" },
  };

  it("adds projectDir when no existing config", () => {
    const result = mergeAllowedProjects(baseEntry, null, "/home/user/project");
    expect(result.ALLOWED_PROJECTS).toBe("/home/user/project");
  });

  it("merges with existing ALLOWED_PROJECTS", () => {
    const existingConfig: McpConfig = {
      command: "node",
      args: "server.js",
      env: "ALLOWED_PROJECTS=/existing/proj",
    };
    const result = mergeAllowedProjects(baseEntry, existingConfig, "/new/proj");
    const projects = result.ALLOWED_PROJECTS.split(",");
    expect(projects).toContain("/existing/proj");
    expect(projects).toContain("/new/proj");
  });

  it("does not duplicate existing projectDir", () => {
    const existingConfig: McpConfig = {
      command: "node",
      args: "server.js",
      env: "ALLOWED_PROJECTS=/home/user/project",
    };
    const result = mergeAllowedProjects(baseEntry, existingConfig, "/home/user/project");
    expect(result.ALLOWED_PROJECTS).toBe("/home/user/project");
  });
});

describe("mergeAllowedScripts", () => {
  it("adds new scripts when no existing config", () => {
    const env = { ALLOWED_SCRIPTS: "" };
    const result = mergeAllowedScripts(env, null, ["test", "build"]);
    const scripts = result.ALLOWED_SCRIPTS.split(",");
    expect(scripts).toContain("test");
    expect(scripts).toContain("build");
  });

  it("merges with existing ALLOWED_SCRIPTS", () => {
    const env = { ALLOWED_SCRIPTS: "" };
    const existingConfig: McpConfig = {
      command: "node",
      args: "server.js",
      env: "ALLOWED_SCRIPTS=test,lint",
    };
    const result = mergeAllowedScripts(env, existingConfig, ["build", "deploy"]);
    const scripts = result.ALLOWED_SCRIPTS.split(",");
    expect(scripts).toContain("test");
    expect(scripts).toContain("lint");
    expect(scripts).toContain("build");
    expect(scripts).toContain("deploy");
  });

  it("does not duplicate existing scripts", () => {
    const env = { ALLOWED_SCRIPTS: "" };
    const existingConfig: McpConfig = {
      command: "node",
      args: "server.js",
      env: "ALLOWED_SCRIPTS=test,build",
    };
    const result = mergeAllowedScripts(env, existingConfig, ["test", "build"]);
    const scripts = result.ALLOWED_SCRIPTS.split(",").filter(Boolean);
    expect(scripts).toEqual(["test", "build"]);
  });

  it("handles empty new scripts list", () => {
    const env = { ALLOWED_SCRIPTS: "" };
    const existingConfig: McpConfig = {
      command: "node",
      args: "server.js",
      env: "ALLOWED_SCRIPTS=test",
    };
    const result = mergeAllowedScripts(env, existingConfig, []);
    expect(result.ALLOWED_SCRIPTS).toBe("test");
  });
});

describe("formatNewConfig", () => {
  it("formats entry without env", () => {
    const entry: McpEntryInfo = {
      serverDir: "srv",
      name: "srv",
      command: "node",
      args: ["server.js", "--port", "3000"],
    };
    const config = formatNewConfig(entry);
    expect(config.command).toBe("node");
    expect(config.args).toBe("server.js --port 3000");
    expect(config.env).toBe("");
  });

  it("formats entry with env", () => {
    const entry: McpEntryInfo = {
      serverDir: "srv",
      name: "srv",
      command: "node",
      args: ["index.js"],
      env: { API_KEY: "abc", DEBUG: "true" },
    };
    const config = formatNewConfig(entry);
    expect(config.env).toBe("API_KEY=abc, DEBUG=true");
  });
});

describe("buildDiff", () => {
  it("returns null when configs are identical", () => {
    const config: McpConfig = {
      command: "node",
      args: "server.js",
      env: "KEY=val",
    };
    expect(buildDiff(config, config)).toBeNull();
  });

  it("detects command change", () => {
    const old: McpConfig = { command: "node", args: "server.js", env: "" };
    const new_: McpConfig = { command: "npx", args: "server.js", env: "" };
    const diff = buildDiff(old, new_);
    expect(diff).toContain("command");
    expect(diff).toContain("node");
    expect(diff).toContain("npx");
  });

  it("detects args change", () => {
    const old: McpConfig = { command: "node", args: "old.js", env: "" };
    const new_: McpConfig = { command: "node", args: "new.js", env: "" };
    const diff = buildDiff(old, new_);
    expect(diff).toContain("args");
  });

  it("detects env change", () => {
    const old: McpConfig = { command: "node", args: "s.js", env: "K=old" };
    const new_: McpConfig = { command: "node", args: "s.js", env: "K=new" };
    const diff = buildDiff(old, new_);
    expect(diff).toContain("env");
  });

  it("shows (なし) for empty values", () => {
    const old: McpConfig = { command: "node", args: "s.js", env: "" };
    const new_: McpConfig = { command: "node", args: "s.js", env: "K=v" };
    const diff = buildDiff(old, new_);
    expect(diff).toContain("(なし)");
  });
});
