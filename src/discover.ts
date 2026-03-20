import * as fs from "fs";
import * as path from "path";

export interface SkillInfo {
  name: string;
  srcPath: string;
  category: string;
}

export interface AgentInfo {
  name: string;
  srcPath: string;
  category: string;
}

export interface PluginInfo {
  pluginId: string;
  registry: string;
  channel: string;
  enabled: boolean;
}

export interface HookScriptInfo {
  name: string;
  srcPath: string;
}

export interface McpEntryInfo {
  serverDir: string;
  srcPath: string;
  json: Record<string, unknown>;
}

export function discoverSkills(repoDir: string): SkillInfo[] {
  const skillsDir = path.join(repoDir, "tools", "skills");
  const results: SkillInfo[] = [];

  if (!fs.existsSync(skillsDir)) return results;

  for (const category of fs.readdirSync(skillsDir)) {
    const categoryPath = path.join(skillsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const skillName of fs.readdirSync(categoryPath)) {
      const skillPath = path.join(categoryPath, skillName);
      if (!fs.statSync(skillPath).isDirectory()) continue;
      results.push({ name: skillName, srcPath: skillPath, category });
    }
  }

  return results;
}

export function discoverAgents(repoDir: string): AgentInfo[] {
  const agentsDir = path.join(repoDir, "tools", "agents");
  const results: AgentInfo[] = [];

  if (!fs.existsSync(agentsDir)) return results;

  for (const category of fs.readdirSync(agentsDir)) {
    const categoryPath = path.join(agentsDir, category);
    if (!fs.statSync(categoryPath).isDirectory()) continue;

    for (const agentName of fs.readdirSync(categoryPath)) {
      const agentPath = path.join(categoryPath, agentName);
      if (!fs.statSync(agentPath).isDirectory()) continue;
      results.push({ name: agentName, srcPath: agentPath, category });
    }
  }

  return results;
}

export function discoverPlugins(repoDir: string): PluginInfo[] {
  const pluginsDir = path.join(repoDir, "tools", "recommended-plugins");
  const results: PluginInfo[] = [];

  if (!fs.existsSync(pluginsDir)) return results;

  for (const pluginDir of fs.readdirSync(pluginsDir)) {
    const yamlPath = path.join(pluginsDir, pluginDir, "plugin.yaml");
    if (!fs.existsSync(yamlPath)) continue;

    const content = fs.readFileSync(yamlPath, "utf-8");
    const parsed = parsePluginYaml(content);
    if (parsed) results.push(parsed);
  }

  return results;
}

function parsePluginYaml(content: string): PluginInfo | null {
  const get = (key: string): string => {
    const match = content.match(new RegExp(`^${key}:\\s*([^#\\n]*)`, "m"));
    return match ? match[1].trim() : "";
  };

  const pluginId = get("plugin_id");
  const registry = get("registry");
  const channel = get("channel");
  const enabledStr = get("enabled");

  if (!pluginId || !registry || !channel) return null;

  return {
    pluginId,
    registry,
    channel,
    enabled: enabledStr !== "false",
  };
}

export function discoverHookScripts(repoDir: string): HookScriptInfo[] {
  const scriptsDir = path.join(repoDir, "tools", "hooks", "scripts");
  const results: HookScriptInfo[] = [];

  if (!fs.existsSync(scriptsDir)) return results;

  collectShScripts(scriptsDir, results);
  return results;
}

function collectShScripts(dir: string, results: HookScriptInfo[]): void {
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    const stat = fs.statSync(entryPath);
    if (stat.isDirectory()) {
      collectShScripts(entryPath, results);
    } else if (entry.endsWith(".sh")) {
      results.push({ name: entry, srcPath: entryPath });
    }
  }
}

export function discoverMcpEntries(repoDir: string): McpEntryInfo[] {
  const mcpDir = path.join(repoDir, "tools", "mcp");
  const results: McpEntryInfo[] = [];

  if (!fs.existsSync(mcpDir)) return results;

  for (const serverDir of fs.readdirSync(mcpDir)) {
    const mcpJsonPath = path.join(mcpDir, serverDir, ".mcp.json");
    if (!fs.existsSync(mcpJsonPath)) continue;

    const json = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8")) as Record<string, unknown>;
    results.push({ serverDir, srcPath: mcpJsonPath, json });
  }

  return results;
}

export function discoverClaudeMdTemplates(repoDir: string): string[] {
  const templatesDir = path.join(repoDir, "tools", "claude-md-templates");
  const results: string[] = [];

  if (!fs.existsSync(templatesDir)) return results;

  for (const templateName of fs.readdirSync(templatesDir)) {
    const claudeMdPath = path.join(templatesDir, templateName, "CLAUDE.md");
    if (fs.existsSync(claudeMdPath)) {
      results.push(templateName);
    }
  }

  return results;
}
