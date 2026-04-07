#!/usr/bin/env node
import * as fs from "fs";
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
  discoverHookSets,
  discoverMcpEntries,
  discoverMcpRecommendations,
  discoverClaudeMdTemplates,
  discoverSandboxTemplates,
  type PluginInfo,
} from "./discover.js";
import { copyDir, copyFile, ensureDir } from "./copy.js";
import { installMcp } from "./mcp-install.js";
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
      hint: "claude mcp add 経由でインストール",
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
    initialValues: isGlobal ? [] : ["skills", "agents", "plugins"],
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
    ensureDir(path.join(installDir, "skills"), { dryRun: DRY_RUN });
    const skills = discoverSkills(REPO_DIR);

    // Check how many already exist
    const existingSkills = skills.filter((skill) =>
      fs.existsSync(path.join(installDir, "skills", skill.name)),
    );

    let overwriteSkills = false;
    if (existingSkills.length > 0) {
      const shouldUpdate = await confirm({
        message: `既にインストール済みの Skills が ${existingSkills.length} 個あります。上書きして更新しますか？`,
        initialValue: true,
      });
      if (isCancel(shouldUpdate)) {
        cancel("キャンセルしました。");
        process.exit(0);
      }
      overwriteSkills = shouldUpdate;
    }

    const s = spinner();
    s.start("Skills をインストール中...");
    let copied = 0;
    let updated = 0;
    let skipped = 0;
    for (const skill of skills) {
      const dst = path.join(installDir, "skills", skill.name);
      const result = copyDir(skill.srcPath, dst, { dryRun: DRY_RUN, overwrite: overwriteSkills });
      if (result.action === "copied") copied++;
      else if (result.action === "updated") updated++;
      else skipped++;
    }
    const parts = [`${copied} 個インストール`];
    if (updated > 0) parts.push(`${updated} 個更新`);
    if (skipped > 0) parts.push(`${skipped} 個スキップ`);
    s.stop(`Skills: ${parts.join("、")}（計 ${skills.length} 個）`);
  }

  // Agents
  if (selectedComponents.includes("agents")) {
    ensureDir(path.join(installDir, "agents"), { dryRun: DRY_RUN });
    const agents = discoverAgents(REPO_DIR);

    const existingAgents = agents.filter((agent) =>
      fs.existsSync(path.join(installDir, "agents", agent.name)),
    );

    let overwriteAgents = false;
    if (existingAgents.length > 0) {
      const shouldUpdate = await confirm({
        message: `既にインストール済みの Agents が ${existingAgents.length} 個あります。上書きして更新しますか？`,
        initialValue: true,
      });
      if (isCancel(shouldUpdate)) {
        cancel("キャンセルしました。");
        process.exit(0);
      }
      overwriteAgents = shouldUpdate;
    }

    const s = spinner();
    s.start("Agents をインストール中...");
    let copied = 0;
    let updated = 0;
    let skipped = 0;
    for (const agent of agents) {
      const dst = path.join(installDir, "agents", agent.name);
      const result = copyDir(agent.srcPath, dst, { dryRun: DRY_RUN, overwrite: overwriteAgents });
      if (result.action === "copied") copied++;
      else if (result.action === "updated") updated++;
      else skipped++;
    }
    const parts = [`${copied} 個インストール`];
    if (updated > 0) parts.push(`${updated} 個更新`);
    if (skipped > 0) parts.push(`${skipped} 個スキップ`);
    s.stop(`Agents: ${parts.join("、")}（計 ${agents.length} 個）`);
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
      initialValues: [],
      required: false,
    });

    if (isCancel(selectedHookIds)) {
      cancel("キャンセルしました。");
      process.exit(0);
    }

    const selectedIds = selectedHookIds as string[];
    const selectedHookSets = allHookSets.filter((hs) => selectedIds.includes(hs.name));

    if (selectedHookSets.length > 0) {
      const hooksDir = path.join(installDir, "hooks");
      ensureDir(hooksDir, { dryRun: DRY_RUN });

      // Check how many scripts already exist
      const existingScripts = selectedHookSets.flatMap((hs) =>
        hs.scripts.filter((script) => fs.existsSync(path.join(hooksDir, script.name))),
      );

      let overwriteHooks = false;
      if (existingScripts.length > 0) {
        const shouldUpdate = await confirm({
          message: `既にインストール済みの Hook スクリプトが ${existingScripts.length} 個あります。上書きして更新しますか？`,
          initialValue: false,
        });
        if (isCancel(shouldUpdate)) {
          cancel("キャンセルしました。");
          process.exit(0);
        }
        overwriteHooks = shouldUpdate;
      }

      const s = spinner();
      s.start("Hooks をインストール中...");
      let copied = 0;
      let updated = 0;
      let skipped = 0;
      const copiedScripts: string[] = [];

      for (const hookSet of selectedHookSets) {
        for (const script of hookSet.scripts) {
          const dst = path.join(hooksDir, script.name);
          const result = copyFile(script.srcPath, dst, {
            dryRun: DRY_RUN,
            executable: true,
            overwrite: overwriteHooks,
          });
          if (result.action === "copied") {
            copied++;
            copiedScripts.push(dst);
          } else if (result.action === "updated") {
            updated++;
            copiedScripts.push(dst);
          } else {
            skipped++;
          }
        }
        installedHookSets.push(hookSet);
      }

      const totalScripts = selectedHookSets.reduce((n, hs) => n + hs.scripts.length, 0);
      const parts = [`${copied} 個インストール`];
      if (updated > 0) parts.push(`${updated} 個更新`);
      if (skipped > 0) parts.push(`${skipped} 個スキップ`);
      s.stop(`Hooks: ${parts.join("、")}（計 ${totalScripts} 個）`);

      if (copiedScripts.length > 0) {
        const chmodLines = copiedScripts.map((p) => `  chmod +x ${p}`).join("\n");
        log.info(
          `スクリプトへの実行権限は自動的に付与されています。手動で確認・再付与する場合:\n${chmodLines}`,
        );
      }

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
  if (selectedComponents.includes("mcp")) {
    const allEntries = discoverMcpEntries(REPO_DIR);

    const selectedMcpIds = await multiselect({
      message: "インストールする MCP サーバーを選んでください（スペースで選択）",
      options: allEntries.map((e) => ({
        value: e.serverDir,
        label: e.serverDir,
        hint: e.local
          ? `ローカルサーバー → ~/.claude/mcp-servers/${e.name}/`
          : `${e.command} ${e.args.join(" ")}`,
      })),
      initialValues: [],
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
      s.start("MCP サーバーをインストール中...");
      let installed = 0;
      let updated = 0;
      let failed = 0;
      const failedMcps: string[] = [];
      const updatedMcps: Array<{ name: string; previousConfig?: string; diff?: string }> = [];

      const repoMcpDir = path.join(REPO_DIR, "tools", "mcp");
      for (const entry of selectedEntries) {
        const result = installMcp(entry, {
          scope: "global",
          dryRun: DRY_RUN,
          repoMcpDir,
          projectDir: process.cwd(),
        });
        if (result.action === "installed") {
          installed++;
        } else if (result.action === "updated") {
          updated++;
          updatedMcps.push({
            name: result.name,
            previousConfig: result.previousConfig,
            diff: result.diff,
          });
        } else if (result.action === "failed") {
          failed++;
          failedMcps.push(`${entry.name} (${result.reason})`);
        }
      }

      const mcpParts = [`${installed} 個インストール`];
      if (updated > 0) mcpParts.push(`${updated} 個更新`);
      if (failed > 0) mcpParts.push(`${failed} 個失敗`);
      s.stop(`MCP: ${mcpParts.join("、")}`);
      for (const msg of failedMcps) {
        log.warn(`  スキップ: ${msg}`);
      }
      for (const mcp of updatedMcps) {
        if (mcp.previousConfig) {
          log.info(`[${mcp.name}] 更新前の設定:\n  ${mcp.previousConfig}`);
        }
        if (mcp.diff) {
          log.info(`[${mcp.name}] 変更点:\n${mcp.diff}`);
        } else if (mcp.previousConfig) {
          log.info(`[${mcp.name}] 設定に差分はありません（再インストール）`);
        }
      }

      // Show post-install notes for MCP servers
      for (const entry of selectedEntries) {
        if (entry.postInstallNote) {
          log.info(`\n[MCP: ${entry.name}] インストール後の作業:\n${entry.postInstallNote}`);
        }
      }
    }
  }

  // MCP Recommendations (shown regardless of whether MCP was selected)
  const mcpRecommendations = discoverMcpRecommendations(REPO_DIR);
  if (mcpRecommendations.length > 0) {
    const lines = mcpRecommendations.map(
      (r) =>
        `  - ${r.name}: ${r.description}\n    ${r.note}\n    ${r.url}\n    例: ${r.installHint}`,
    );
    log.info(`\nその他の便利な MCP サーバー:\n${lines.join("\n")}`);
  }

  // CLAUDE.md
  if (claudeMdTemplate) {
    const templateSrc = path.join(
      REPO_DIR,
      "tools",
      "claude-md-templates",
      claudeMdTemplate,
      "CLAUDE.md",
    );
    const dst = path.join(process.cwd(), "CLAUDE.md");

    let overwriteClaudeMd = false;
    if (fs.existsSync(dst)) {
      const shouldUpdate = await confirm({
        message: "CLAUDE.md は既に存在します。上書きして更新しますか？",
        initialValue: false,
      });
      if (isCancel(shouldUpdate)) {
        cancel("キャンセルしました。");
        process.exit(0);
      }
      overwriteClaudeMd = shouldUpdate;
    }

    const s = spinner();
    s.start("CLAUDE.md を配置中...");
    const result = copyFile(templateSrc, dst, { dryRun: DRY_RUN, overwrite: overwriteClaudeMd });
    if (result.action === "copied") {
      s.stop(`CLAUDE.md を配置しました（テンプレート: ${claudeMdTemplate}）`);
    } else if (result.action === "updated") {
      s.stop(`CLAUDE.md を更新しました（テンプレート: ${claudeMdTemplate}）`);
    } else {
      s.stop("CLAUDE.md は既に存在するためスキップしました");
    }
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

  // Sandbox recommended settings
  const sandboxTemplates = discoverSandboxTemplates(REPO_DIR);
  if (sandboxTemplates.length > 0) {
    const showSandbox = await confirm({
      message: "Sandbox 推奨設定を表示しますか？",
      initialValue: false,
    });

    if (!isCancel(showSandbox) && showSandbox) {
      const templateId = await select({
        message: "プロジェクトの種類を選んでください",
        options: sandboxTemplates.map((t) => ({
          value: t.id,
          label: t.name,
          hint: t.description,
        })),
      });

      if (!isCancel(templateId)) {
        const template = sandboxTemplates.find((t) => t.id === templateId);
        if (template) {
          const settingsPath = isGlobal ? "~/.claude/settings.json" : ".claude/settings.json";
          const json = JSON.stringify({ sandbox: template.sandbox }, null, 2);

          log.info(
            [
              "",
              "以下の設定を settings.json に追加すると、sandbox モードで",
              "開発に必要なネットワークアクセスを許可できます。",
              "",
              `対象ファイル: ${settingsPath}`,
              "",
              json,
              "",
              "手順:",
              `  1. 上記 JSON を ${settingsPath} にマージしてください`,
              "  2. Claude Code を --sandbox フラグ付きで起動するか、",
              "     上記設定の sandbox.enabled を利用してください",
              "",
              ...(template.notes.length > 0 ? ["注意:", ...template.notes, ""] : []),
            ].join("\n"),
          );
        }
      }
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
