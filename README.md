# claude-code-tools

複数プロジェクトで再利用できる Claude Code ツールのライブラリです。

Skills（スラッシュコマンド）、Agents（サブエージェント）、CLAUDE.md テンプレートを一元管理し、各プロジェクトへ配布します。

## 含まれるもの

| ディレクトリ | 内容 |
|---|---|
| [`tools/skills/`](tools/skills/) | スラッシュコマンド定義（`/commit`, `/review-pr` など） |
| [`tools/agents/`](tools/agents/) | サブエージェント定義（コードレビュー専門・テスト生成専門など） |
| [`tools/recommended-plugins/`](tools/recommended-plugins/) | 公式・OSS plugin の推薦カタログ |
| [`tools/claude-md-templates/`](tools/claude-md-templates/) | プロジェクト種別ごとの CLAUDE.md テンプレート |
| [`tools/hooks/`](tools/hooks/) | Hook スクリプト（`~/.claude/hooks/` へコピー） |
| [`tools/mcp/`](tools/mcp/) | MCP サーバー設定テンプレート（`~/.claude/.mcp.json` へマージ） |
| [`docs/`](docs/) | 設計思想・オーサリングガイド |

## インストール方法

### 一括インストール（推奨）

```bash
git clone https://github.com/yourname/claude-code-tools
cd claude-code-tools
./install.sh
```

Skills・Agents を現在のディレクトリの `.claude/` へシンボリックリンクし、推薦 plugins を `claude plugin install --scope project` でインストールします。

```bash
./install.sh --dry-run             # 実行内容を確認するだけ
./install.sh --global              # ~/.claude/ へグローバルインストール
./install.sh --global --add-hooks  # さらに hooks を追加
./install.sh --global --add-mcp    # さらに mcp を追加
./install.sh --global --add-hooks --add-mcp  # tools/ を全て追加
```

### 手動インストール（個別）

特定のものだけ入れたい場合は手動でシンボリックリンクを張ります。

```bash
REPO=~/path/to/claude-code-tools

# Skill
ln -s "$REPO/tools/skills/git/commit" ~/.claude/skills/commit

# Agent
ln -s "$REPO/tools/agents/review/code-reviewer" ~/.claude/agents/code-reviewer
```

### プロジェクトへの導入

別プロジェクトの `.claude/` に skills・agents をシンボリックリンクし、CLAUDE.md テンプレートを配置します。

```bash
cd ~/my-project
~/path/to/claude-code-tools/install.sh --claude-md                    # base テンプレート
~/path/to/claude-code-tools/install.sh --claude-md=typescript-node    # テンプレート指定
~/path/to/claude-code-tools/install.sh --claude-md --dry-run          # 確認のみ
```

シンボリックリンクを使うため、`git pull` するだけで全プロジェクトに即座に反映されます。

### アップデート

```bash
# skills/agents のアップデート（シンボリックリンクのため自動反映）
cd ~/path/to/claude-code-tools && git pull

# 新たに追加された plugins をインストール
~/path/to/claude-code-tools/install.sh
```

## ディレクトリ詳細

### tools/skills/

各スキルは `tools/skills/<category>/<skill-name>/` に格納されています。

- `SKILL.md` — Claude Code が読む定義ファイル（フロントマター + プロンプト）
- `README.md` — 使い方・例（人間向け）

利用可能なスキル一覧は [`tools/skills/README.md`](tools/skills/README.md) を参照。

### tools/agents/

各エージェントは `tools/agents/<category>/<agent-name>/` に格納されています。

- `<agent-name>.md` — エージェント定義ファイル（`.claude/agents/<name>/<name>.md` に対応）
- `README.md` — 使い方・例（人間向け）

利用可能なエージェント一覧は [`tools/agents/README.md`](tools/agents/README.md) を参照。

### tools/claude-md-templates/

プロジェクト種別ごとの CLAUDE.md テンプレートです。新しいプロジェクトに `CLAUDE.md` としてコピーして使います。

利用可能なテンプレート一覧は [`tools/claude-md-templates/README.md`](tools/claude-md-templates/README.md) を参照。

### tools/hooks/

Claude Code のライフサイクルイベントに応じて実行される Hook スクリプトです。

- `scripts/` — Hook スクリプト（`~/.claude/hooks/` へコピーされます）
- `configs/` — `settings.json` への設定スニペット（手動でマージしてください）

### tools/mcp/

MCP（Model Context Protocol）サーバーの設定テンプレートです。`~/.claude/.mcp.json` に自動マージされます（`jq` が必要）。
