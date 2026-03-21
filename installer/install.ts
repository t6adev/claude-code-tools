#!/usr/bin/env node
import * as path from "path";
import * as os from "os";
import { fileURLToPath } from "url";
import { intro, outro, select, multiselect, spinner, log, cancel, isCancel } from "@clack/prompts";
import {
  discoverSkills,
  discoverAgents,
  discoverPlugins,
  discoverHookSets,
  discoverMcpEntries,
  discoverClaudeMdTemplates,
  type PluginInfo,
} from "./discover.js";
import { copyDir, copyFile, ensureDir } from "./copy.js";
import { mergeMcpJson } from "./mcp-merge.js";
import { mergeSettingsHooks, type AddedEntry } from "./settings-merge.js";
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
const REPO_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const HELP = process.argv.includes("--help") || process.argv.includes("-h");
const FORCE = process.argv.includes("--force");
const DRY_RUN = process.argv.includes("--dry-run");

if (HELP) {
  console.log(`
Usage: npx claude-code-tools [options]

Options:
  --help, -h    このヘルプを表示して終了
  --force       このリポジトリ自体へのインストールを強制的に許可する
  --dry-run     実際の変更を行わずにインストール手順をシミュレートする
`);
  process.exit(0);
}

function checkIsInsideRepo(installDir: string): boolean {
  return installDir === REPO_DIR || installDir.startsWith(REPO_DIR + path.sep);
}

async function main(): Promise<void> {
  intro("claude-code-tools インストーラー");

  if (DRY_RUN) {
    log.warn("ドライランモード: 実際の変更は行いません。");
  }

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
    if (!FORCE) {
      log.error("claude-code-tools リポジトリ内ではローカルインストールできません。");
      log.info("--global を選択するか、別のプロジェクトで実行してください。");
      log.info("リポジトリ内へのインストールを強制するには --force を指定してください。");
      process.exit(1);
    }
    log.warn("--force が指定されました。リポジトリ内へのローカルインストールを続行します。");
  }

  // --- Step 2: Components ---
  const claudeMdTemplates = !isGlobal ? discoverClaudeMdTemplates(REPO_DIR) : [];
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
    {
      value: "hooks",
      label: "Hooks（hook スクリプト）",
      hint: `${installDir}/hooks/`,
    },
    {
      value: "mcp",
      label: "MCP サーバー設定",
      hint: `${installDir}/.mcp.json`,
    },
    ...claudeMdTemplates.map((t) => ({
      value: `claude-md:${t}`,
      label: `CLAUDE.md テンプレート: ${t}`,
      hint: `${process.cwd()}/CLAUDE.md`,
    })),
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

  // Extract CLAUDE.md template from selection (value format: "claude-md:<template>")
  const claudeMdEntry = selectedComponents.find((c) => c.startsWith("claude-md:"));
  const claudeMdTemplate: string | null = claudeMdEntry
    ? claudeMdEntry.slice("claude-md:".length)
    : null;

  // --- Step 3: Optional plugins ---
  let optionalPlugins: PluginInfo[] = [];
  if (selectedComponents.includes("plugins")) {
    const allPlugins = discoverPlugins(REPO_DIR);
    const optionalCandidates = allPlugins.filter((p) => !p.enabled);
    if (optionalCandidates.length > 0) {
      const selected = await multiselect({
        message:
          "オプションプラグイン（デフォルト無効）も追加インストールしますか？（スペースで選択）",
        options: optionalCandidates.map((p) => ({
          value: p.pluginId,
          label: p.pluginId,
          hint: "オプション",
        })),
        initialValues: [],
        required: false,
      });
      if (isCancel(selected)) {
        cancel("キャンセルしました。");
        process.exit(0);
      }
      const selectedIds = selected as string[];
      optionalPlugins = optionalCandidates
        .filter((p) => selectedIds.includes(p.pluginId))
        .map((p) => ({ ...p, enabled: true }));
    }
  }

  // --- Step 4: Execute ---

  // Skills
  if (selectedComponents.includes("skills")) {
    const s = spinner();
    s.start("Skills をインストール中...");
    ensureDir(path.join(installDir, "skills"), { dryRun: DRY_RUN });
    const skills = discoverSkills(REPO_DIR);
    let copied = 0;
    let skipped = 0;
    for (const skill of skills) {
      const dst = path.join(installDir, "skills", skill.name);
      const result = copyDir(skill.srcPath, dst, { dryRun: DRY_RUN });
      if (result.action === "copied") copied++;
      else skipped++;
    }
    s.stop(`Skills: ${copied} 個インストール、${skipped} 個スキップ（計 ${skills.length} 個）`);
  }

  // Agents
  if (selectedComponents.includes("agents")) {
    const s = spinner();
    s.start("Agents をインストール中...");
    ensureDir(path.join(installDir, "agents"), { dryRun: DRY_RUN });
    const agents = discoverAgents(REPO_DIR);
    let copied = 0;
    let skipped = 0;
    for (const agent of agents) {
      const dst = path.join(installDir, "agents", agent.name);
      const result = copyDir(agent.srcPath, dst, { dryRun: DRY_RUN });
      if (result.action === "copied") copied++;
      else skipped++;
    }
    s.stop(`Agents: ${copied} 個インストール、${skipped} 個スキップ（計 ${agents.length} 個）`);
  }

  // Plugins
  if (selectedComponents.includes("plugins")) {
    const s = spinner();
    s.start("Recommended Plugins をインストール中...");
    const plugins = [...discoverPlugins(REPO_DIR).filter((p) => p.enabled), ...optionalPlugins];
    let installed = 0;
    let failed = 0;
    const failedPlugins: string[] = [];

    for (const plugin of plugins) {
      const result = installPlugin(plugin, {
        scope: isGlobal ? "global" : "local",
        dryRun: DRY_RUN,
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

  // Hooks
  const hooksMergeLog: AddedEntry[] = [];
  let hookSettingsFile: string | null = null;
  const installedHookSets: ReturnType<typeof discoverHookSets> = [];
  if (selectedComponents.includes("hooks")) {
    const allHookSets = discoverHookSets(REPO_DIR);

    const selectedHookIds = await multiselect({
      message: "インストールする Hook セットを選んでください（スペースで選択）",
      options: allHookSets.map((hs) => ({
        value: hs.name,
        label: hs.name,
        hint: hs.scripts.map((s) => s.name).join(", "),
      })),
      initialValues: allHookSets.map((hs) => hs.name),
      required: false,
    });

    if (isCancel(selectedHookIds)) {
      cancel("キャンセルしました。");
      process.exit(0);
    }

    const selectedIds = selectedHookIds as string[];
    const selectedHookSets = allHookSets.filter((hs) => selectedIds.includes(hs.name));

    if (selectedHookSets.length > 0) {
      const s = spinner();
      s.start("Hooks をインストール中...");
      const hooksDir = path.join(installDir, "hooks");
      ensureDir(hooksDir, { dryRun: DRY_RUN });
      let copied = 0;
      let skipped = 0;

      for (const hookSet of selectedHookSets) {
        for (const script of hookSet.scripts) {
          const dst = path.join(hooksDir, script.name);
          const result = copyFile(script.srcPath, dst, {
            dryRun: DRY_RUN,
            executable: true,
          });
          if (result.action === "copied") copied++;
          else skipped++;
        }
        installedHookSets.push(hookSet);
      }

      const totalScripts = selectedHookSets.reduce((n, hs) => n + hs.scripts.length, 0);
      s.stop(`Hooks: ${copied} 個インストール、${skipped} 個スキップ（計 ${totalScripts} 個）`);

      // Merge hook configs into settings file
      const allConfigs = selectedHookSets.flatMap((hs) => hs.configs);
      if (allConfigs.length > 0) {
        const settingsTarget = await select({
          message: "Hook configs を settings にマージします。対象ファイルを選んでください",
          options: [
            {
              value: "settings.json",
              label: "settings.json",
              hint: `${installDir}/settings.json（プロジェクト共有）`,
            },
            {
              value: "settings.local.json",
              label: "settings.local.json",
              hint: `${installDir}/settings.local.json（個人設定・gitignore 推奨）`,
            },
          ],
        });

        if (isCancel(settingsTarget)) {
          cancel("キャンセルしました。");
          process.exit(0);
        }

        hookSettingsFile = settingsTarget as string;
        const settingsDstPath = path.join(installDir, hookSettingsFile);
        const ms = spinner();
        ms.start("Hook configs をマージ中...");

        for (const config of allConfigs) {
          const rewrittenHooks = rewriteHookCommandPaths(config.hooks as HooksMap, hooksDir);
          const result = mergeSettingsHooks(settingsDstPath, rewrittenHooks, { dryRun: DRY_RUN });
          hooksMergeLog.push(...result.addedEntries);
        }

        if (hooksMergeLog.length > 0) {
          ms.stop(`Hook configs をマージしました (${hookSettingsFile})`);
        } else {
          ms.stop(`Hook configs: 変更なし（全て既存のエントリと重複）`);
        }
      }
    }
  }

  // MCP
  const installedMcpEntries: ReturnType<typeof discoverMcpEntries> = [];
  if (selectedComponents.includes("mcp")) {
    const allEntries = discoverMcpEntries(REPO_DIR);

    const selectedMcpIds = await multiselect({
      message: "インストールする MCP サーバーを選んでください（スペースで選択）",
      options: allEntries.map((e) => ({
        value: e.serverDir,
        label: e.serverDir,
        hint: Object.keys(
          (e.json as { mcpServers?: Record<string, unknown> }).mcpServers ?? {},
        ).join(", "),
      })),
      initialValues: allEntries.map((e) => e.serverDir),
      required: false,
    });

    if (isCancel(selectedMcpIds)) {
      cancel("キャンセルしました。");
      process.exit(0);
    }

    const selectedIds = selectedMcpIds as string[];
    const selectedEntries = allEntries.filter((e) => selectedIds.includes(e.serverDir));

    if (selectedEntries.length > 0) {
      const s = spinner();
      s.start("MCP サーバー設定をインストール中...");
      const mcpDstPath = path.join(installDir, ".mcp.json");
      let merged = 0;
      let noop = 0;

      for (const entry of selectedEntries) {
        const servers = (entry.json as { mcpServers?: Record<string, unknown> }).mcpServers ?? {};
        const result = mergeMcpJson(mcpDstPath, servers, {
          dryRun: DRY_RUN,
        });
        if (result.action === "merged") {
          merged++;
          installedMcpEntries.push(entry);
        } else {
          noop++;
          installedMcpEntries.push(entry);
        }
      }

      s.stop(`MCP: ${merged} 個マージ、${noop} 個スキップ（計 ${selectedEntries.length} 個）`);
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
      "CLAUDE.md",
    );
    const dst = path.join(process.cwd(), "CLAUDE.md");
    const result = copyFile(templateSrc, dst, { dryRun: DRY_RUN });
    s.stop(
      result.action === "copied"
        ? `CLAUDE.md を配置しました（テンプレート: ${claudeMdTemplate}）`
        : "CLAUDE.md は既に存在するためスキップしました",
    );
  }

  // Show hook config merge summary
  if (hooksMergeLog.length > 0 && hookSettingsFile) {
    log.info(`Hook configs の変更内容 (${hookSettingsFile}):`);
    for (const entry of hooksMergeLog) {
      log.info(`  + ${entry.event}: ${entry.command}`);
    }
  }

  // Show post-install notes for installed Hook sets
  for (const hookSet of installedHookSets) {
    if (hookSet.postInstallNote) {
      log.info(`\n[Hook: ${hookSet.name}] インストール後の作業:\n${hookSet.postInstallNote}`);
    }
  }

  // Show post-install notes for installed MCP servers
  for (const entry of installedMcpEntries) {
    if (entry.postInstallNote) {
      log.info(`\n[MCP: ${entry.serverDir}] インストール後の作業:\n${entry.postInstallNote}`);
    }
  }

  outro(
    DRY_RUN
      ? "ドライラン完了。実際にインストールするには再実行してください。"
      : "インストール完了！\n  更新するには npx を再実行してください。",
  );
}

type HooksMap = Record<
  string,
  Array<{ matcher?: string; hooks: Array<{ type: string; command: string }> }>
>;

function rewriteHookCommandPaths(hooks: HooksMap, hooksDir: string): HooksMap {
  return Object.fromEntries(
    Object.entries(hooks).map(([event, groups]) => [
      event,
      groups.map((group) => ({
        ...group,
        hooks: group.hooks.map((h) => ({
          ...h,
          command: path.join(hooksDir, path.basename(h.command)),
        })),
      })),
    ]),
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
