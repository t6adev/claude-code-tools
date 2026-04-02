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

export interface HookSetInfo {
  name: string;
  setDir: string;
  scripts: Array<{ name: string; srcPath: string }>;
  configs: Array<{ name: string; hooks: Record<string, unknown> }>;
  postInstallNote: string | null;
}

export interface McpEntryInfo {
  serverDir: string;
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
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

export function discoverHookSets(repoDir: string): HookSetInfo[] {
  const hooksDir = path.join(repoDir, "tools", "hooks");
  const results: HookSetInfo[] = [];

  if (!fs.existsSync(hooksDir)) return results;

  for (const setName of fs.readdirSync(hooksDir)) {
    const setDir = path.join(hooksDir, setName);
    if (!fs.statSync(setDir).isDirectory()) continue;

    const scripts: HookSetInfo["scripts"] = [];
    const configs: HookSetInfo["configs"] = [];

    for (const file of fs.readdirSync(setDir)) {
      const filePath = path.join(setDir, file);
      if (file.endsWith(".sh")) {
        scripts.push({ name: file, srcPath: filePath });
      } else if (file.endsWith(".json")) {
        const json = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Record<string, unknown>;
        if (json.hooks) {
          configs.push({
            name: file.replace(/\.json$/, ""),
            hooks: json.hooks as Record<string, unknown>,
          });
        }
      }
    }

    if (scripts.length === 0 && configs.length === 0) continue;

    const notePath = path.join(setDir, "POST_INSTALL.md");
    const postInstallNote = fs.existsSync(notePath)
      ? fs.readFileSync(notePath, "utf-8").trim()
      : null;

    results.push({ name: setName, setDir, scripts, configs, postInstallNote });
  }

  return results;
}

export function discoverMcpEntries(repoDir: string): McpEntryInfo[] {
  const mcpDir = path.join(repoDir, "tools", "mcp");
  const results: McpEntryInfo[] = [];

  if (!fs.existsSync(mcpDir)) return results;

  for (const serverDir of fs.readdirSync(mcpDir)) {
    const yamlPath = path.join(mcpDir, serverDir, "mcp.yaml");
    if (!fs.existsSync(yamlPath)) continue;

    const content = fs.readFileSync(yamlPath, "utf-8");
    const parsed = parseMcpYaml(content);
    if (parsed) results.push({ serverDir, ...parsed });
  }

  return results;
}

function parseMcpYaml(content: string): Omit<McpEntryInfo, "serverDir"> | null {
  const get = (key: string): string => {
    const match = content.match(new RegExp(`^${key}:\\s*"?([^"#\\n]*)"?`, "m"));
    return match ? match[1].trim() : "";
  };

  const name = get("name");
  const command = get("command");
  const argsRaw = get("args");

  if (!name || !command || !argsRaw) return null;

  const args = argsRaw.split(/\s+/);

  // Parse env block (simple key: value pairs indented under "env:")
  const env: Record<string, string> = {};
  const envMatch = content.match(/^env:\s*\n((?:\s+.+\n?)*)/m);
  if (envMatch) {
    for (const line of envMatch[1].split("\n")) {
      const kv = line.match(/^\s+(\w+):\s*"?([^"#\n]*)"?\s*$/);
      if (kv) env[kv[1]] = kv[2].trim();
    }
  }

  return {
    name,
    command,
    args,
    ...(Object.keys(env).length > 0 ? { env } : {}),
  };
}

export interface McpRecommendation {
  name: string;
  description: string;
  note: string;
  url: string;
  installHint: string;
}

export function discoverMcpRecommendations(repoDir: string): McpRecommendation[] {
  const yamlPath = path.join(repoDir, "tools", "mcp", "recommendations.yaml");
  if (!fs.existsSync(yamlPath)) return [];

  const content = fs.readFileSync(yamlPath, "utf-8");
  return parseMcpRecommendations(content);
}

function parseMcpRecommendations(content: string): McpRecommendation[] {
  const results: McpRecommendation[] = [];
  // Split by top-level list items (- name:)
  const entries = content.split(/^- name:/m).slice(1);

  for (const entry of entries) {
    const block = "name:" + entry;
    const get = (key: string): string => {
      const match = block.match(new RegExp(`^\\s*${key}:\\s*"?([^"\\n]*)"?`, "m"));
      return match ? match[1].trim() : "";
    };

    const name = get("name");
    const description = get("description");
    const note = get("note");
    const url = get("url");
    const installHint = get("install_hint");

    if (name && description && url) {
      results.push({ name, description, note, url, installHint });
    }
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
