# claude-code-tools

このリポジトリは Claude Code ツール（Skills・Agents・CLAUDE.md テンプレート等）のライブラリです。
このリポジトリ自体が Claude Code を使って何かを構築するプロジェクトではなく、**Claude Code のツールを管理・提供するリポジトリ**です。

## リポジトリ構成

```
skills/      スラッシュコマンド定義（SKILL.md）
agents/      サブエージェント定義
templates/   プロジェクト種別ごとの CLAUDE.md テンプレート
hooks/       Hook スクリプト・設定スニペット
mcp/         MCP サーバー設定テンプレート
docs/        設計思想・貢献ガイド
```

## このリポジトリで作業する際のルール

### 新しい Skill を追加する

1. カテゴリを決める（`git/`, `code/`, `docs/`, `infra/`, `meta/`）
2. `skills/<category>/<skill-name>/SKILL.md` を作成（機械可読な定義）
3. `skills/<category>/<skill-name>/README.md` を作成（使い方・例）
4. `skills/README.md` のインデックスに追記
5. `docs/skill-authoring-guide.md` の規約に従う

### 新しい Agent を追加する

1. カテゴリを決める（`review/`, `testing/`, `docs/`, `ops/`）
2. `agents/<category>/<agent-name>/<agent-name>.md` を作成（ファイル名はディレクトリ名と一致させる）
3. `agents/<category>/<agent-name>/README.md` を作成
4. `agents/README.md` のインデックスに追記
5. `docs/agent-authoring-guide.md` の規約に従う

### CLAUDE.md テンプレートを追加する

1. `templates/<project-type>/CLAUDE.md` を作成
2. `templates/README.md` に追記

## 制約

- `install/install.sh` は明示的に指示されない限り実行しない（グローバル設定を変更するため）
- このリポジトリ外の `.claude/settings.json` を変更しない
- SKILL.md とエージェント定義ファイルはコードと同等の品質で管理する

## 命名規則

- ディレクトリ名・ファイル名: `lowercase-with-hyphens`（アンダースコア不使用）
- スキル名 = スラッシュコマンド名 = ディレクトリ名
- エージェント定義ファイル名 = ディレクトリ名 + `.md`（例: `code-reviewer/code-reviewer.md`）
