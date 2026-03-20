#!/usr/bin/env node
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";
import {
  intro,
  outro,
  select,
  multiselect,
  confirm,
  spinner,
  log,
  cancel,
  isCancel,
} from "@clack/prompts";
import {
  discoverSkills,
  discoverAgents,
  discoverPlugins,
  discoverHookScripts,
  discoverMcpEntries,
  discoverClaudeMdTemplates,
} from "./discover.js";
import { copyDir, copyFile, ensureDir } from "./copy.js";
import { mergeMcpJson } from "./mcp-merge.js";
import { installPlugin } from "./plugins.js";

// Node.js version check
const [major] = process.versions.node.split(".").map(Number);
if (major < 18) {
  console.error("Error: Node.js 18 or higher is required.");
  process.exit(1);
}

// Windows check
if (process.platform === "win32") {
  console.error("Error: Windows is not supported.");
  process.exit(1);
}

// REPO_DIR: directory containing the package (one level up from this script)
const REPO_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function checkIsInsideRepo(installDir: string): boolean {
  return installDir === REPO_DIR || installDir.startsWith(REPO_DIR + path.sep);
}

async function main(): Promise<void> {
  intro("claude-code-tools インストーラー");

  // --- Step 1: Scope ---
  const scope = await select({
    message: "インストール先を選んでください",
    options: [
      {
        value: "local",
        label: "ローカル (./.claude/)",
        hint: "現在のプロジェクトにのみ適用",
      },
      {
        value: "global",
        label: "グローバル (~/.claude/)",
        hint: "すべてのプロジェクトで使用可能、plugins も追加",
      },
    ],
  });

  if (isCancel(scope)) {
    cancel("キャンセルしました。");
    process.exit(0);
  }

  const isGlobal = scope === "global";
  const installDir = isGlobal
    ? path.join(os.homedir(), ".claude")
    : path.join(process.cwd(), ".claude");

  // Guard: prevent installing into the repo itself
  if (!isGlobal && checkIsInsideRepo(process.cwd())) {
    log.error(
      "claude-code-tools リポジトリ内ではローカルインストールできません。"
    );
    log.info("--global を選択するか、別のプロジェクトで実行してください。");
    process.exit(1);
  }

  // --- Step 2: Components ---
  const componentOptions = [
    {
      value: "skills",
      label: "Skills（スラッシュコマンド）",
      hint: `${installDir}/skills/`,
    },
    {
      value: "agents",
      label: "Agents（サブエージェント）",
      hint: `${installDir}/agents/`,
    },
    {
      value: "plugins",
      label: "Recommended Plugins",
      hint: "claude CLI 経由でインストール",
    },
    ...(isGlobal
      ? [
          {
            value: "hooks",
            label: "Hooks（hook スクリプト）",
            hint: "~/.claude/hooks/",
          },
          {
            value: "mcp",
            label: "MCP サーバー設定",
            hint: "~/.claude/.mcp.json",
          },
        ]
      : []),
  ];

  const components = await multiselect({
    message: "インストールする項目を選んでください（スペースで選択）",
    options: componentOptions,
    initialValues: ["skills", "agents", "plugins"],
    required: true,
  });

  if (isCancel(components)) {
    cancel("キャンセルしました。");
    process.exit(0);
  }

  const selectedComponents = components as string[];

  // --- Step 3: CLAUDE.md template (local only) ---
  let claudeMdTemplate: string | null = null;
  if (!isGlobal) {
    const templates = discoverClaudeMdTemplates(REPO_DIR);
    const templateOptions = [
      { value: "skip", label: "スキップ" },
      ...templates.map((t) => ({ value: t, label: t })),
    ];

    const templateChoice = await select({
      message: "CLAUDE.md テンプレートを配置しますか？",
      options: templateOptions,
    });

    if (isCancel(templateChoice)) {
      cancel("キャンセルしました。");
      process.exit(0);
    }

    if (templateChoice !== "skip") {
      claudeMdTemplate = templateChoice as string;
    }
  }

  // --- Step 4: Dry run? ---
  const dryRun = await confirm({
    message: "ドライラン（変更なしで確認のみ）モードで実行しますか？",
    initialValue: false,
  });

  if (isCancel(dryRun)) {
    cancel("キャンセルしました。");
    process.exit(0);
  }

  if (dryRun) {
    log.warn("ドライランモード: 実際の変更は行いません。");
  }

  // --- Step 5: Execute ---

  // Skills
  if (selectedComponents.includes("skills")) {
    const s = spinner();
    s.start("Skills をインストール中...");
    ensureDir(path.join(installDir, "skills"), { dryRun: dryRun as boolean });
    const skills = discoverSkills(REPO_DIR);
    let copied = 0;
    let skipped = 0;
    for (const skill of skills) {
      const dst = path.join(installDir, "skills", skill.name);
      const result = copyDir(skill.srcPath, dst, { dryRun: dryRun as boolean });
      if (result.action === "copied") copied++;
      else skipped++;
    }
    s.stop(
      `Skills: ${copied} 個インストール、${skipped} 個スキップ（計 ${skills.length} 個）`
    );
  }

  // Agents
  if (selectedComponents.includes("agents")) {
    const s = spinner();
    s.start("Agents をインストール中...");
    ensureDir(path.join(installDir, "agents"), { dryRun: dryRun as boolean });
    const agents = discoverAgents(REPO_DIR);
    let copied = 0;
    let skipped = 0;
    for (const agent of agents) {
      const dst = path.join(installDir, "agents", agent.name);
      const result = copyDir(agent.srcPath, dst, { dryRun: dryRun as boolean });
      if (result.action === "copied") copied++;
      else skipped++;
    }
    s.stop(
      `Agents: ${copied} 個インストール、${skipped} 個スキップ（計 ${agents.length} 個）`
    );
  }

  // Plugins
  if (selectedComponents.includes("plugins")) {
    const s = spinner();
    s.start("Recommended Plugins をインストール中...");
    const plugins = discoverPlugins(REPO_DIR).filter((p) => p.enabled);
    let installed = 0;
    let failed = 0;
    const failedPlugins: string[] = [];

    for (const plugin of plugins) {
      const result = installPlugin(plugin, {
        scope: isGlobal ? "global" : "local",
        dryRun: dryRun as boolean,
      });
      if (result.action === "installed") installed++;
      else if (result.action === "failed") {
        failed++;
        failedPlugins.push(`${plugin.pluginId} (${result.reason})`);
      }
    }

    s.stop(`Plugins: ${installed} 個インストール、${failed} 個失敗`);
    for (const msg of failedPlugins) {
      log.warn(`  スキップ: ${msg}`);
    }
  }

  // Hooks (global only)
  if (selectedComponents.includes("hooks")) {
    const s = spinner();
    s.start("Hooks をインストール中...");
    const hooksDir = path.join(os.homedir(), ".claude", "hooks");
    ensureDir(hooksDir, { dryRun: dryRun as boolean });
    const scripts = discoverHookScripts(REPO_DIR);
    let copied = 0;
    let skipped = 0;
    for (const script of scripts) {
      const dst = path.join(hooksDir, script.name);
      const result = copyFile(script.srcPath, dst, {
        dryRun: dryRun as boolean,
        executable: true,
      });
      if (result.action === "copied") copied++;
      else skipped++;
    }
    s.stop(
      `Hooks: ${copied} 個インストール、${skipped} 個スキップ（計 ${scripts.length} 個）`
    );
    log.info(
      "Hook の settings.json 設定は tools/hooks/configs/ を参照して手動でマージしてください。"
    );
  }

  // MCP (global only)
  if (selectedComponents.includes("mcp")) {
    const s = spinner();
    s.start("MCP サーバー設定をインストール中...");
    const mcpDstPath = path.join(os.homedir(), ".claude", ".mcp.json");
    const entries = discoverMcpEntries(REPO_DIR);
    let merged = 0;
    let noop = 0;
    let hasPlaceholder = false;

    for (const entry of entries) {
      const servers = (
        entry.json as { mcpServers?: Record<string, unknown> }
      ).mcpServers ?? {};
      const result = mergeMcpJson(mcpDstPath, servers, {
        dryRun: dryRun as boolean,
      });
      if (result.action === "merged") merged++;
      else noop++;
      if (result.hasPlaceholder) hasPlaceholder = true;
    }

    s.stop(
      `MCP: ${merged} 個マージ、${noop} 個スキップ（計 ${entries.length} 個）`
    );
    if (hasPlaceholder) {
      log.warn(
        `~/.claude/.mcp.json の filesystem エントリに "/path/to/allowed/directory" プレースホルダーが含まれています。`
      );
      log.warn("実際のパスに手動で書き換えてください。");
    }
  }

  // CLAUDE.md
  if (claudeMdTemplate) {
    const s = spinner();
    s.start("CLAUDE.md を配置中...");
    const templateSrc = path.join(
      REPO_DIR,
      "tools",
      "claude-md-templates",
      claudeMdTemplate,
      "CLAUDE.md"
    );
    const dst = path.join(process.cwd(), "CLAUDE.md");
    const result = copyFile(templateSrc, dst, { dryRun: dryRun as boolean });
    s.stop(
      result.action === "copied"
        ? `CLAUDE.md を配置しました（テンプレート: ${claudeMdTemplate}）`
        : "CLAUDE.md は既に存在するためスキップしました"
    );
  }

  outro(
    dryRun
      ? "ドライラン完了。実際にインストールするには再実行してください。"
      : "インストール完了！\n  更新するには npx を再実行してください。"
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
