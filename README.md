# claude-code-tools

複数プロジェクトで再利用できる Claude Code ツールのライブラリです。

Skills（スラッシュコマンド）、Agents（サブエージェント）、CLAUDE.md テンプレートを一元管理し、各プロジェクトへ配布します。

## 含まれるもの

| ディレクトリ | 内容 |
|---|---|
| [`skills/`](skills/) | スラッシュコマンド定義（`/commit`, `/review-pr` など） |
| [`agents/`](agents/) | サブエージェント定義（コードレビュー専門・テスト生成専門など） |
| [`recommended-plugins/`](recommended-plugins/) | 公式・OSS plugin の推薦カタログ |
| [`templates/`](templates/) | プロジェクト種別ごとの CLAUDE.md テンプレート |
| [`hooks/`](hooks/) | Hook スクリプト・settings.json スニペット |
| [`mcp/`](mcp/) | MCP サーバー設定テンプレート |
| [`docs/`](docs/) | 設計思想・貢献ガイド |

## インストール方法

### 一括インストール（推奨）

```bash
git clone https://github.com/yourname/claude-code-tools
cd claude-code-tools
./install.sh
```

Skills・Agents をグローバル（`~/.claude/`）へシンボリックリンクし、推薦 plugins を `claude plugin install` でインストールします。

```bash
./install.sh --dry-run    # 実行内容を確認するだけ
./install.sh --no-plugins # plugins のインストールをスキップ
```

### 手動インストール（個別）

特定のものだけ入れたい場合は手動でシンボリックリンクを張ります。

```bash
REPO=~/path/to/claude-code-tools

# Skill
ln -s "$REPO/skills/git/commit" ~/.claude/skills/commit

# Agent
ln -s "$REPO/agents/review/code-reviewer" ~/.claude/agents/code-reviewer
```

### プロジェクトへの導入

別プロジェクトの `.claude/` に skills・agents をシンボリックリンクし、CLAUDE.md テンプレートを配置します。

```bash
cd ~/my-project
~/path/to/claude-code-tools/install.sh --project                    # base テンプレート
~/path/to/claude-code-tools/install.sh --project=typescript-node    # テンプレート指定
~/path/to/claude-code-tools/install.sh --project --dry-run          # 確認のみ
```

シンボリックリンクを使うため、`git pull` するだけで全プロジェクトに即座に反映されます。

### アップデート

```bash
# skills/agents のアップデート（シンボリックリンクのため自動反映）
cd ~/path/to/claude-code-tools && git pull

# 新たに追加された plugins をインストール
~/path/to/claude-code-tools/install.sh --no-skills --no-agents
```

## ディレクトリ詳細

### skills/

各スキルは `skills/<category>/<skill-name>/` に格納されています。

- `SKILL.md` — Claude Code が読む定義ファイル（フロントマター + プロンプト）
- `README.md` — 使い方・例（人間向け）

利用可能なスキル一覧は [`skills/README.md`](skills/README.md) を参照。

### agents/

各エージェントは `agents/<category>/<agent-name>/` に格納されています。

- `<agent-name>.md` — エージェント定義ファイル（`~/.claude/agents/<name>/<name>.md` に対応）
- `README.md` — 使い方・例（人間向け）

利用可能なエージェント一覧は [`agents/README.md`](agents/README.md) を参照。

### templates/

プロジェクト種別ごとの CLAUDE.md テンプレートです。新しいプロジェクトに `CLAUDE.md` としてコピーして使います。

利用可能なテンプレート一覧は [`templates/README.md`](templates/README.md) を参照。

## 貢献方法

[`docs/contributing.md`](docs/contributing.md) を参照してください。

## ライセンス

MIT
