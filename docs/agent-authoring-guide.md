# Agent 作成ガイド

## ファイル構成

```
tools/agents/<category>/<agent-name>/
├── <agent-name>.md    # 機械可読な定義（必須・ファイル名はディレクトリ名と一致）
└── README.md          # 人間向けドキュメント（必須）
```

## カテゴリ一覧

| カテゴリ | 用途 |
|---|---|
| `review/` | コードレビュー・監査 |
| `testing/` | テスト生成・品質保証 |
| `docs/` | ドキュメント作成 |
| `ops/` | デプロイ・インフラ操作 |

## ファイル命名規則

エージェント定義ファイル名はディレクトリ名と一致させます。

```
agents/review/code-reviewer/code-reviewer.md   ✓
agents/review/code-reviewer/AGENT.md           ✗
```

これは Claude Code のインストール先（`~/.claude/agents/<name>/<name>.md`）と対応させるためです。

## フォーマット

```markdown
---
name: <agent-name>
description: <このエージェントをいつ使うかの説明（英語）>
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
---

システムプロンプト
```

## フロントマター フィールド

| フィールド | 必須 | 説明 |
|---|---|---|
| `name` | 必須 | エージェント識別子。ディレクトリ名と一致させる |
| `description` | 必須 | 親エージェントがこのエージェントに委譲する際の判断基準。英語で書く |
| `tools` | 任意 | 許可するツール。省略すると全ツール継承 |
| `disallowedTools` | 任意 | 明示的に禁止するツール |
| `model` | 任意 | `sonnet`（デフォルト）、`opus`、`haiku`、またはモデル ID |
| `maxTurns` | 任意 | 最大ターン数 |
| `permissionMode` | 任意 | `default`、`acceptEdits`、`dontAsk`、`bypassPermissions`、`plan` |

## 良い `description` の書き方

`description` は親エージェントがサブエージェントに委譲するかを判断する基準です。

**良い例:**
```
Expert code reviewer specializing in security, performance, and maintainability.
Use when reviewing pull requests or code changes before merging.
```

**悪い例:**
```
Reviews code
```

- 専門性・役割を明確に（Expert X specializing in Y）
- いつ使うべきかの文脈を含める（Use when ...）
- 英語で書く

## システムプロンプトの書き方

- 役割・専門性を冒頭で宣言する
- 作業手順を番号付きリストで示す
- 出力フォーマットを明示する（箇条書き？表？）
- 重要度・優先順位の判断基準を含める

### 例（code-reviewer エージェント）

```markdown
---
name: code-reviewer
description: Expert code reviewer specializing in security, performance, and maintainability.
  Use when reviewing pull requests or significant code changes.
tools: Read, Grep, Glob, Bash
disallowedTools: Write, Edit
model: sonnet
---

あなたはシニアソフトウェアエンジニアとして、コードレビューを行います。
セキュリティ・パフォーマンス・保守性を重視します。

## 作業手順

1. `git diff` で変更内容を確認する
2. 変更されたファイルを読み込む
3. 以下の観点でレビューする:
   - セキュリティ（インジェクション・認証・機密情報漏洩）
   - パフォーマンス（N+1クエリ・不要なループ）
   - 保守性（命名・複雑度・テスト可能性）
   - バグの可能性

## 出力フォーマット

各問題を以下の形式で報告する:

**[重大度: Critical/High/Medium/Low]** ファイル名:行番号
問題の説明と修正案
```

## plugin-dev を活用する

[`plugin-dev`](../tools/recommended-plugins/plugin-dev/) プラグインをインストールすると、Agent 作成を AI がガイドしてくれます。

```
# Agent 作成の相談
「新しいエージェントを作りたい。description の書き方は？」
→ plugin-dev の agent-development スキルが自動でロードされる
```

`agent-development` スキルが提供するもの:
- `<example>` ブロックを使った信頼性の高いトリガー設計
- システムプロンプトのデザインパターン（分析・生成・バリデーション・オーケストレーション）
- AI アシスト生成（Claude Code 公式の agent-creation-prompt を使ったワークフロー）
- `validate-agent.sh` による検証ユーティリティ

## ミニマムチェックリスト

- [ ] ファイル名がディレクトリ名と一致している
- [ ] `description` が英語で役割と使用文脈を含んでいる
- [ ] `tools` が必要最小限に絞られている（特に書き込み系は慎重に）
- [ ] README.md が添付されている
- [ ] `tools/agents/README.md` のテーブルに追記している

詳細は [pr-checklist.md](pr-checklist.md) を参照。
