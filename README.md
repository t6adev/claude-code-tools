# claude-code-tools

複数プロジェクトで再利用できる Claude Code ツールのライブラリです。

Skills（スラッシュコマンド）、Agents（サブエージェント）、CLAUDE.md テンプレートを一元管理し、各プロジェクトへ配布します。

## 含まれるもの

| ディレクトリ | 内容 |
|---|---|
| [`skills/`](skills/) | スラッシュコマンド定義（`/commit`, `/review-pr` など） |
| [`agents/`](agents/) | サブエージェント定義（コードレビュー専門・テスト生成専門など） |
| [`templates/`](templates/) | プロジェクト種別ごとの CLAUDE.md テンプレート |
| [`hooks/`](hooks/) | Hook スクリプト・settings.json スニペット |
| [`mcp/`](mcp/) | MCP サーバー設定テンプレート |
| [`docs/`](docs/) | 設計思想・貢献ガイド |

## インストール方法

インストールスクリプトは準備中です。現在は手動でインストールしてください。

### グローバルへインストール（シンボリックリンク）

リポジトリの変更が即座に反映されます。

```bash
REPO=~/path/to/claude-code-tools

# Skill のインストール例
ln -s "$REPO/skills/git/commit" ~/.claude/skills/commit
ln -s "$REPO/skills/git/review-pr" ~/.claude/skills/review-pr

# Agent のインストール例
ln -s "$REPO/agents/review/code-reviewer" ~/.claude/agents/code-reviewer
```

### プロジェクトへインストール（コピー）

プロジェクトを自己完結させたい場合はコピーします。

```bash
REPO=~/path/to/claude-code-tools

# Skill のコピー
cp -r "$REPO/skills/git/commit" .claude/skills/

# CLAUDE.md テンプレートのコピー
cp "$REPO/templates/typescript-node/CLAUDE.md" ./CLAUDE.md
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
