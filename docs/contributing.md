# 貢献ガイド

## 命名規則

- ディレクトリ名・ファイル名は `lowercase-with-hyphens`（アンダースコア不使用）
- スキル名 = スラッシュコマンド名 = ディレクトリ名
- エージェント定義ファイル名 = ディレクトリ名 + `.md`（例: `code-reviewer/code-reviewer.md`）

## Skill を追加する

### ファイル構成

```
skills/<category>/<skill-name>/
├── SKILL.md    # 機械可読な定義（必須）
└── README.md   # 人間向けドキュメント（必須）
```

### カテゴリ一覧

| カテゴリ | 用途 |
|---|---|
| `git/` | git 操作・コミット・PR 関連 |
| `code/` | コード編集・リファクタリング・説明 |
| `docs/` | ドキュメント生成・更新 |
| `infra/` | インフラ・デプロイ関連 |
| `meta/` | claude-code-tools 自体の操作 |

カテゴリが増える場合はこのファイルも更新してください。

### SKILL.md の書き方

詳細は [`skill-authoring-guide.md`](skill-authoring-guide.md) を参照。

最低限のフォーマット:

```markdown
---
name: <skill-name>
description: <Claude がいつこのスキルを使うかの説明（英語）>
allowed-tools: <カンマ区切りのツールリスト>
---

<スキルのプロンプト本文>
```

### README.md の書き方

```markdown
# <skill-name>

<1〜2行の概要>

## 使い方

/<skill-name> [引数]

## 例

/<skill-name> feat

## 動作

<スキルが何をするかの説明>
```

### 追加後の手順

1. `skills/README.md` のテーブルに追記する
2. PR を作成してレビューを依頼する

---

## Agent を追加する

### ファイル構成

```
agents/<category>/<agent-name>/
├── <agent-name>.md    # 機械可読な定義（必須・ファイル名はディレクトリ名と一致）
└── README.md          # 人間向けドキュメント（必須）
```

### カテゴリ一覧

| カテゴリ | 用途 |
|---|---|
| `review/` | コードレビュー・監査 |
| `testing/` | テスト生成・品質保証 |
| `docs/` | ドキュメント作成 |
| `ops/` | デプロイ・インフラ操作 |

### <agent-name>.md の書き方

詳細は [`agent-authoring-guide.md`](agent-authoring-guide.md) を参照。

最低限のフォーマット:

```markdown
---
name: <agent-name>
description: <このエージェントをいつ使うかの説明（英語）>
tools: <カンマ区切りの許可ツール>
disallowedTools: <カンマ区切りの禁止ツール>
model: sonnet
---

<システムプロンプト>
```

### 追加後の手順

1. `agents/README.md` のテーブルに追記する
2. PR を作成してレビューを依頼する

---

## CLAUDE.md テンプレートを追加する

### ファイル構成

```
templates/<project-type>/
└── CLAUDE.md
```

### 追加後の手順

1. `templates/README.md` のテーブルに追記する
2. PR を作成してレビューを依頼する

---

## Hook スクリプトを追加する

### ファイル構成

```
hooks/scripts/<event-type>/
└── <script-name>.sh    # 実行スクリプト（必須）

hooks/scripts/<event-type>/
└── README.md           # スクリプト一覧（更新する）

hooks/configs/
└── <preset-name>.json  # settings.json スニペット（任意）
```

### イベントタイプ

| ディレクトリ | イベント |
|---|---|
| `pre-tool/` | `PreToolUse`（ツール実行前） |
| `post-tool/` | `PostToolUse` / `Stop` |

### スクリプトの要件

- `#!/usr/bin/env bash` で始める
- `set -euo pipefail` を先頭に置く
- stdin から `jq` で tool_input を読む
- 終了コード: `0`=許可、`1`=警告、`2`=強制ブロック（PreToolUse のみ）
- 実行権限を付与する（`chmod +x`）

### 追加後の手順

1. `chmod +x` で実行権限を付与する
2. 対応する `hooks/scripts/<event>/README.md` のテーブルに追記する
3. 設定スニペットが必要なら `hooks/configs/<name>.json` を追加する
4. PR を作成してレビューを依頼する

---

## MCP サーバー設定を追加する

### ファイル構成

```
mcp/<server-name>/
├── .mcp.json    # 設定テンプレート（必須）
└── README.md    # 使い方・前提条件（必須）
```

### 追加後の手順

1. `mcp/README.md` のテーブルに追記する
2. PR を作成してレビューを依頼する

---

## PR のチェックリスト

- [ ] 命名規則（lowercase-with-hyphens）に従っている
- [ ] `SKILL.md` / `<agent-name>.md` のフロントマターが正しい
- [ ] `README.md` が添付されている
- [ ] インデックスファイル（`skills/README.md` 等）が更新されている
