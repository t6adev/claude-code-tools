import * as fs from "fs";

type McpServers = Record<string, unknown>;
type McpJson = { mcpServers: McpServers };

export interface MergeMcpResult {
  action: "merged" | "noop";
  addedKeys: string[];
  hasPlaceholder: boolean;
}

export function mergeMcpJson(
  dstPath: string,
  newEntries: McpServers,
  opts: { dryRun: boolean }
): MergeMcpResult {
  let existing: McpJson = { mcpServers: {} };

  if (fs.existsSync(dstPath)) {
    const raw = fs.readFileSync(dstPath, "utf-8");
    existing = JSON.parse(raw) as McpJson;
    if (!existing.mcpServers) existing.mcpServers = {};
  }

  const addedKeys: string[] = [];
  for (const key of Object.keys(newEntries)) {
    if (!(key in existing.mcpServers)) {
      addedKeys.push(key);
    }
  }

  const hasPlaceholder = JSON.stringify(newEntries).includes(
    "/path/to/allowed/directory"
  );

  if (addedKeys.length === 0) {
    return { action: "noop", addedKeys: [], hasPlaceholder };
  }

  if (!opts.dryRun) {
    // Existing entries take precedence (new entries fill in missing keys only)
    const merged: McpJson = {
      mcpServers: { ...newEntries, ...existing.mcpServers },
    };
    fs.writeFileSync(dstPath, JSON.stringify(merged, null, 2) + "\n", "utf-8");
  }

  return { action: "merged", addedKeys, hasPlaceholder };
}
