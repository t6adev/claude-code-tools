# claude-code-tools

複数プロジェクトで再利用できる Claude Code ツールのライブラリです。

Skills（スラッシュコマンド）、Agents（サブエージェント）、CLAUDE.md テンプレートを一元管理し、各プロジェクトへ配布します。

## 含まれるもの

### プロジェクトへ installable

| ディレクトリ | 内容 |
|---|---|
| [`project/skills/`](project/skills/) | スラッシュコマンド定義（`/commit`, `/review-pr` など） |
| [`project/agents/`](project/agents/) | サブエージェント定義（コードレビュー専門・テスト生成専門など） |
| [`project/recommended-plugins/`](project/recommended-plugins/) | 公式・OSS plugin の推薦カタログ |
| [`project/claude-md-templates/`](project/claude-md-templates/) | プロジェクト種別ごとの CLAUDE.md テンプレート |

### グローバル `~/.claude/` へ installable

| ディレクトリ | 内容 |
|---|---|
| [`global/hooks/`](global/hooks/) | Hook スクリプト（`~/.claude/hooks/` へコピー） |
| [`global/mcp/`](global/mcp/) | MCP サーバー設定テンプレート（`~/.claude/.mcp.json` へマージ） |

### このリポジトリ向け

| ディレクトリ | 内容 |
|---|---|
| [`docs/`](docs/) | 設計思想・オーサリングガイド |

## インストール方法

### 一括インストール（推奨）

```bash
git clone https://github.com/yourname/claude-code-tools
cd claude-code-tools
./install.sh
```

Skills・Agents をグローバル（`~/.claude/`）へシンボリックリンクし、推薦 plugins を `claude plugin install` でインストールします。

```bash
./install.sh --dry-run             # 実行内容を確認するだけ
./install.sh --add-hooks           # さらに hooks を追加
./install.sh --add-mcp             # さらに mcp を追加
./install.sh --add-hooks --add-mcp # global/ を全て追加
```

### 手動インストール（個別）

特定のものだけ入れたい場合は手動でシンボリックリンクを張ります。

```bash
REPO=~/path/to/claude-code-tools

# Skill
ln -s "$REPO/project/skills/git/commit" ~/.claude/skills/commit

# Agent
ln -s "$REPO/project/agents/review/code-reviewer" ~/.claude/agents/code-reviewer
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

### project/skills/

各スキルは `project/skills/<category>/<skill-name>/` に格納されています。

- `SKILL.md` — Claude Code が読む定義ファイル（フロントマター + プロンプト）
- `README.md` — 使い方・例（人間向け）

利用可能なスキル一覧は [`project/skills/README.md`](project/skills/README.md) を参照。

### project/agents/

各エージェントは `project/agents/<category>/<agent-name>/` に格納されています。

- `<agent-name>.md` — エージェント定義ファイル（`~/.claude/agents/<name>/<name>.md` に対応）
- `README.md` — 使い方・例（人間向け）

利用可能なエージェント一覧は [`project/agents/README.md`](project/agents/README.md) を参照。

### project/claude-md-templates/

プロジェクト種別ごとの CLAUDE.md テンプレートです。新しいプロジェクトに `CLAUDE.md` としてコピーして使います。

利用可能なテンプレート一覧は [`project/claude-md-templates/README.md`](project/claude-md-templates/README.md) を参照。

### global/hooks/

Claude Code のライフサイクルイベントに応じて実行される Hook スクリプトです。

- `scripts/` — Hook スクリプト（`~/.claude/hooks/` へコピーされます）
- `configs/` — `settings.json` への設定スニペット（手動でマージしてください）

### global/mcp/

MCP（Model Context Protocol）サーバーの設定テンプレートです。`~/.claude/.mcp.json` に自動マージされます（`jq` が必要）。
