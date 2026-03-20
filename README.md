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

### npx で実行（推奨）

```bash
npx github:t6adev/claude-code-tools
```

git clone 不要。対話型 TUI でインストール項目を選択できます。

### devDependencies に追加して使う

```bash
npm install github:t6adev/claude-code-tools --save-dev
npx claude-code-tools
```

### アップデート

ファイルはコピーされるため、新しいツールを取得するには再度 npx を実行してください。

```bash
npx github:t6adev/claude-code-tools
```

### 開発者向け（git clone して使う）

```bash
git clone https://github.com/yourname/claude-code-tools
cd claude-code-tools
npm install
npm run dev
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
