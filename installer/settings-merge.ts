import * as fs from "fs";

type HookEntry = { type: string; command: string };
type HookEvent = Array<{ matcher?: string; hooks: HookEntry[] }>;
type HooksMap = Record<string, HookEvent>;
type SettingsJson = { hooks?: HooksMap; [key: string]: unknown };

export interface AddedEntry {
  event: string;
  command: string;
}

export interface MergeSettingsResult {
  action: "merged" | "noop";
  addedEntries: AddedEntry[];
}

export function mergeSettingsHooks(
  dstPath: string,
  newHooks: HooksMap,
  opts: { dryRun: boolean },
): MergeSettingsResult {
  let existing: SettingsJson = {};

  if (fs.existsSync(dstPath)) {
    const raw = fs.readFileSync(dstPath, "utf-8");
    existing = JSON.parse(raw) as SettingsJson;
  }

  if (!existing.hooks) existing.hooks = {};

  const addedEntries: AddedEntry[] = [];

  for (const [event, newEventEntries] of Object.entries(newHooks)) {
    if (!existing.hooks[event]) {
      existing.hooks[event] = [];
    }

    for (const newGroup of newEventEntries) {
      for (const newHook of newGroup.hooks) {
        const alreadyExists = existing.hooks[event].some((group) =>
          group.hooks.some((h) => h.command === newHook.command),
        );

        if (!alreadyExists) {
          existing.hooks[event].push({
            matcher: newGroup.matcher ?? "",
            hooks: [newHook],
          });
          addedEntries.push({ event, command: newHook.command });
        }
      }
    }
  }

  if (addedEntries.length === 0) {
    return { action: "noop", addedEntries: [] };
  }

  if (!opts.dryRun) {
    fs.writeFileSync(dstPath, JSON.stringify(existing, null, 2) + "\n", "utf-8");
  }

  return { action: "merged", addedEntries };
}
