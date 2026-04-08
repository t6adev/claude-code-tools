import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { mergeSettingsHooks } from "./settings-merge.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "settings-merge-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("mergeSettingsHooks", () => {
  it("creates a new settings file with hooks", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    const newHooks = {
      PreToolUse: [
        {
          matcher: "",
          hooks: [{ type: "command", command: "/path/to/lint.sh" }],
        },
      ],
    };

    const result = mergeSettingsHooks(dstPath, newHooks, { dryRun: false });
    expect(result.action).toBe("merged");
    expect(result.addedEntries).toHaveLength(1);
    expect(result.addedEntries[0]).toEqual({
      event: "PreToolUse",
      command: "/path/to/lint.sh",
    });

    const written = JSON.parse(fs.readFileSync(dstPath, "utf-8"));
    expect(written.hooks.PreToolUse).toHaveLength(1);
    expect(written.hooks.PreToolUse[0].hooks[0].command).toBe("/path/to/lint.sh");
  });

  it("merges into existing settings without duplicating", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    fs.writeFileSync(
      dstPath,
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: "",
              hooks: [{ type: "command", command: "/path/to/lint.sh" }],
            },
          ],
        },
      }),
    );

    const newHooks = {
      PreToolUse: [
        {
          matcher: "",
          hooks: [{ type: "command", command: "/path/to/lint.sh" }],
        },
      ],
    };

    const result = mergeSettingsHooks(dstPath, newHooks, { dryRun: false });
    expect(result.action).toBe("noop");
    expect(result.addedEntries).toHaveLength(0);
  });

  it("adds new hooks to an existing event", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    fs.writeFileSync(
      dstPath,
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: "",
              hooks: [{ type: "command", command: "/path/to/lint.sh" }],
            },
          ],
        },
      }),
    );

    const newHooks = {
      PreToolUse: [
        {
          matcher: "",
          hooks: [{ type: "command", command: "/path/to/format.sh" }],
        },
      ],
    };

    const result = mergeSettingsHooks(dstPath, newHooks, { dryRun: false });
    expect(result.action).toBe("merged");
    expect(result.addedEntries).toHaveLength(1);

    const written = JSON.parse(fs.readFileSync(dstPath, "utf-8"));
    expect(written.hooks.PreToolUse).toHaveLength(2);
  });

  it("adds hooks for a new event type", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    fs.writeFileSync(
      dstPath,
      JSON.stringify({
        hooks: {
          PreToolUse: [
            {
              matcher: "",
              hooks: [{ type: "command", command: "/path/to/lint.sh" }],
            },
          ],
        },
      }),
    );

    const newHooks = {
      PostToolUse: [
        {
          matcher: "",
          hooks: [{ type: "command", command: "/path/to/notify.sh" }],
        },
      ],
    };

    const result = mergeSettingsHooks(dstPath, newHooks, { dryRun: false });
    expect(result.action).toBe("merged");

    const written = JSON.parse(fs.readFileSync(dstPath, "utf-8"));
    expect(written.hooks.PreToolUse).toHaveLength(1);
    expect(written.hooks.PostToolUse).toHaveLength(1);
  });

  it("preserves other settings keys", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    fs.writeFileSync(dstPath, JSON.stringify({ customSetting: true }));

    const newHooks = {
      PreToolUse: [
        {
          matcher: "",
          hooks: [{ type: "command", command: "/path/to/lint.sh" }],
        },
      ],
    };

    mergeSettingsHooks(dstPath, newHooks, { dryRun: false });

    const written = JSON.parse(fs.readFileSync(dstPath, "utf-8"));
    expect(written.customSetting).toBe(true);
    expect(written.hooks.PreToolUse).toHaveLength(1);
  });

  it("does not write in dry-run mode", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    const newHooks = {
      PreToolUse: [
        {
          matcher: "",
          hooks: [{ type: "command", command: "/path/to/lint.sh" }],
        },
      ],
    };

    const result = mergeSettingsHooks(dstPath, newHooks, { dryRun: true });
    expect(result.action).toBe("merged");
    expect(result.addedEntries).toHaveLength(1);
    expect(fs.existsSync(dstPath)).toBe(false);
  });

  it("handles multiple hooks in a single group", () => {
    const dstPath = path.join(tmpDir, "settings.json");
    const newHooks = {
      PreToolUse: [
        {
          matcher: "",
          hooks: [
            { type: "command", command: "/path/to/a.sh" },
            { type: "command", command: "/path/to/b.sh" },
          ],
        },
      ],
    };

    const result = mergeSettingsHooks(dstPath, newHooks, { dryRun: false });
    expect(result.addedEntries).toHaveLength(2);
  });
});
