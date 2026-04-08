import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  discoverSkills,
  discoverAgents,
  discoverPlugins,
  discoverHookSets,
  discoverMcpEntries,
  discoverMcpRecommendations,
  discoverClaudeMdTemplates,
  discoverSandboxTemplates,
} from "./discover.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "discover-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function mkdirs(...segments: string[]): string {
  const p = path.join(tmpDir, ...segments);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function writeFile(content: string, ...segments: string[]): string {
  const p = path.join(tmpDir, ...segments);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content);
  return p;
}

describe("discoverSkills", () => {
  it("returns empty array when tools/skills does not exist", () => {
    expect(discoverSkills(tmpDir)).toEqual([]);
  });

  it("discovers skills organized by category", () => {
    mkdirs("tools", "skills", "git", "commit");
    mkdirs("tools", "skills", "git", "push");
    mkdirs("tools", "skills", "code", "review");

    const skills = discoverSkills(tmpDir);
    expect(skills).toHaveLength(3);

    const names = skills.map((s) => s.name).sort();
    expect(names).toEqual(["commit", "push", "review"]);

    const commitSkill = skills.find((s) => s.name === "commit");
    expect(commitSkill?.category).toBe("git");
    expect(commitSkill?.srcPath).toBe(path.join(tmpDir, "tools", "skills", "git", "commit"));
  });

  it("ignores files in the category directory", () => {
    mkdirs("tools", "skills", "git", "commit");
    writeFile("readme", "tools", "skills", "git", "README.md");

    const skills = discoverSkills(tmpDir);
    expect(skills).toHaveLength(1);
    expect(skills[0].name).toBe("commit");
  });

  it("ignores files in the skills root", () => {
    mkdirs("tools", "skills", "git", "commit");
    writeFile("readme", "tools", "skills", "README.md");

    const skills = discoverSkills(tmpDir);
    expect(skills).toHaveLength(1);
  });
});

describe("discoverAgents", () => {
  it("returns empty array when tools/agents does not exist", () => {
    expect(discoverAgents(tmpDir)).toEqual([]);
  });

  it("discovers agents organized by category", () => {
    mkdirs("tools", "agents", "review", "code-reviewer");
    mkdirs("tools", "agents", "testing", "test-runner");

    const agents = discoverAgents(tmpDir);
    expect(agents).toHaveLength(2);

    const reviewer = agents.find((a) => a.name === "code-reviewer");
    expect(reviewer?.category).toBe("review");
  });
});

describe("discoverPlugins", () => {
  it("returns empty array when tools/recommended-plugins does not exist", () => {
    expect(discoverPlugins(tmpDir)).toEqual([]);
  });

  it("parses plugin.yaml files", () => {
    writeFile(
      [
        "plugin_id: my-plugin",
        "registry: https://registry.example.com",
        "channel: stable",
        "enabled: true",
      ].join("\n"),
      "tools",
      "recommended-plugins",
      "my-plugin",
      "plugin.yaml",
    );

    const plugins = discoverPlugins(tmpDir);
    expect(plugins).toHaveLength(1);
    expect(plugins[0]).toEqual({
      pluginId: "my-plugin",
      registry: "https://registry.example.com",
      channel: "stable",
      enabled: true,
    });
  });

  it("parses enabled: false correctly", () => {
    writeFile(
      [
        "plugin_id: optional-plugin",
        "registry: https://r.example.com",
        "channel: beta",
        "enabled: false",
      ].join("\n"),
      "tools",
      "recommended-plugins",
      "optional-plugin",
      "plugin.yaml",
    );

    const plugins = discoverPlugins(tmpDir);
    expect(plugins).toHaveLength(1);
    expect(plugins[0].enabled).toBe(false);
  });

  it("skips directories without plugin.yaml", () => {
    mkdirs("tools", "recommended-plugins", "no-yaml");
    writeFile("just a readme", "tools", "recommended-plugins", "no-yaml", "README.md");

    const plugins = discoverPlugins(tmpDir);
    expect(plugins).toHaveLength(0);
  });

  it("skips plugin.yaml with missing required fields", () => {
    writeFile(
      ["plugin_id: incomplete", "registry: https://r.example.com"].join("\n"),
      "tools",
      "recommended-plugins",
      "incomplete",
      "plugin.yaml",
    );

    const plugins = discoverPlugins(tmpDir);
    expect(plugins).toHaveLength(0);
  });
});

describe("discoverHookSets", () => {
  it("returns empty array when tools/hooks does not exist", () => {
    expect(discoverHookSets(tmpDir)).toEqual([]);
  });

  it("discovers hook sets with scripts and configs", () => {
    mkdirs("tools", "hooks", "pre-commit");
    writeFile("#!/bin/bash\necho hello", "tools", "hooks", "pre-commit", "lint.sh");
    writeFile(
      JSON.stringify({
        hooks: {
          PreToolUse: [{ hooks: [{ type: "command", command: "lint.sh" }] }],
        },
      }),
      "tools",
      "hooks",
      "pre-commit",
      "config.json",
    );

    const hookSets = discoverHookSets(tmpDir);
    expect(hookSets).toHaveLength(1);
    expect(hookSets[0].name).toBe("pre-commit");
    expect(hookSets[0].scripts).toHaveLength(1);
    expect(hookSets[0].scripts[0].name).toBe("lint.sh");
    expect(hookSets[0].configs).toHaveLength(1);
    expect(hookSets[0].configs[0].name).toBe("config");
  });

  it("reads POST_INSTALL.md if present", () => {
    mkdirs("tools", "hooks", "my-hook");
    writeFile("#!/bin/bash", "tools", "hooks", "my-hook", "run.sh");
    writeFile("Do this after install", "tools", "hooks", "my-hook", "POST_INSTALL.md");

    const hookSets = discoverHookSets(tmpDir);
    expect(hookSets[0].postInstallNote).toBe("Do this after install");
  });

  it("sets postInstallNote to null when POST_INSTALL.md is absent", () => {
    mkdirs("tools", "hooks", "my-hook");
    writeFile("#!/bin/bash", "tools", "hooks", "my-hook", "run.sh");

    const hookSets = discoverHookSets(tmpDir);
    expect(hookSets[0].postInstallNote).toBeNull();
  });

  it("skips empty directories", () => {
    mkdirs("tools", "hooks", "empty-set");

    const hookSets = discoverHookSets(tmpDir);
    expect(hookSets).toHaveLength(0);
  });
});

describe("discoverMcpEntries", () => {
  it("returns empty array when tools/mcp does not exist", () => {
    expect(discoverMcpEntries(tmpDir)).toEqual([]);
  });

  it("parses mcp.yaml with basic fields", () => {
    writeFile(
      ["name: my-server", "command: npx", "args: -y @example/server"].join("\n"),
      "tools",
      "mcp",
      "my-server",
      "mcp.yaml",
    );

    const entries = discoverMcpEntries(tmpDir);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      serverDir: "my-server",
      name: "my-server",
      command: "npx",
      args: ["-y", "@example/server"],
    });
  });

  it("parses env block", () => {
    writeFile(
      [
        "name: srv",
        "command: node",
        "args: index.js",
        "env:",
        '  API_KEY: "abc123"',
        '  DEBUG: "true"',
      ].join("\n"),
      "tools",
      "mcp",
      "srv",
      "mcp.yaml",
    );

    const entries = discoverMcpEntries(tmpDir);
    expect(entries[0].env).toEqual({ API_KEY: "abc123", DEBUG: "true" });
  });

  it("parses local flag and files list", () => {
    writeFile(
      [
        "name: local-srv",
        "command: node",
        "args: server.js",
        "local: true",
        "files: package.json server.js",
      ].join("\n"),
      "tools",
      "mcp",
      "local-srv",
      "mcp.yaml",
    );

    const entries = discoverMcpEntries(tmpDir);
    expect(entries[0].local).toBe(true);
    expect(entries[0].files).toEqual(["package.json", "server.js"]);
  });

  it("reads POST_INSTALL.md", () => {
    writeFile(
      ["name: srv", "command: node", "args: index.js"].join("\n"),
      "tools",
      "mcp",
      "srv",
      "mcp.yaml",
    );
    writeFile("Configure env vars", "tools", "mcp", "srv", "POST_INSTALL.md");

    const entries = discoverMcpEntries(tmpDir);
    expect(entries[0].postInstallNote).toBe("Configure env vars");
  });

  it("skips directories without mcp.yaml", () => {
    mkdirs("tools", "mcp", "no-config");

    const entries = discoverMcpEntries(tmpDir);
    expect(entries).toHaveLength(0);
  });
});

describe("discoverMcpRecommendations", () => {
  it("returns empty array when recommendations.yaml does not exist", () => {
    expect(discoverMcpRecommendations(tmpDir)).toEqual([]);
  });

  it("parses recommendations.yaml", () => {
    writeFile(
      [
        "- name: cool-server",
        "  description: A cool server",
        "  note: Requires API key",
        "  url: https://example.com",
        "  install_hint: npx cool-server",
      ].join("\n"),
      "tools",
      "mcp",
      "recommendations.yaml",
    );

    const recs = discoverMcpRecommendations(tmpDir);
    expect(recs).toHaveLength(1);
    expect(recs[0]).toEqual({
      name: "cool-server",
      description: "A cool server",
      note: "Requires API key",
      url: "https://example.com",
      installHint: "npx cool-server",
    });
  });
});

describe("discoverSandboxTemplates", () => {
  it("returns empty array when tools/sandbox does not exist", () => {
    expect(discoverSandboxTemplates(tmpDir)).toEqual([]);
  });

  it("discovers sandbox template JSON files", () => {
    writeFile(
      JSON.stringify({
        name: "Web App",
        description: "For web applications",
        notes: ["Check CORS settings"],
        sandbox: { enabled: true },
      }),
      "tools",
      "sandbox",
      "web-app.json",
    );

    const templates = discoverSandboxTemplates(tmpDir);
    expect(templates).toHaveLength(1);
    expect(templates[0]).toEqual({
      id: "web-app",
      name: "Web App",
      description: "For web applications",
      notes: ["Check CORS settings"],
      sandbox: { enabled: true },
    });
  });

  it("skips JSON files without required fields", () => {
    writeFile(JSON.stringify({ description: "no name field" }), "tools", "sandbox", "invalid.json");

    const templates = discoverSandboxTemplates(tmpDir);
    expect(templates).toHaveLength(0);
  });
});

describe("discoverClaudeMdTemplates", () => {
  it("returns empty array when templates dir does not exist", () => {
    expect(discoverClaudeMdTemplates(tmpDir)).toEqual([]);
  });

  it("discovers templates with CLAUDE.md", () => {
    writeFile("# Template", "tools", "claude-md-templates", "web-app", "CLAUDE.md");
    writeFile("# Template 2", "tools", "claude-md-templates", "cli-tool", "CLAUDE.md");
    mkdirs("tools", "claude-md-templates", "no-claude-md");

    const templates = discoverClaudeMdTemplates(tmpDir);
    expect(templates.sort()).toEqual(["cli-tool", "web-app"]);
  });
});
