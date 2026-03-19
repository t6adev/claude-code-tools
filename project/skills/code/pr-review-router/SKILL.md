---
name: pr-review-router
description: Route a PR review request to the correct tool — code-review plugin (quick parallel scan across all dimensions) or pr-review-toolkit (deep-dive on a specific quality dimension such as type design, error handling, test quality, comments, or simplification). Use when the user asks for a code review, PR review, or mentions a specific quality concern before creating a PR.
allowed-tools: Read
argument-hint: "[review intent or concern]"
---

レビュー意図を解析し、適切なツールへルーティングしてください。

## ツール概要

### code-review（`/code-review:review`）
- **性質**: 網羅的・並列スキャン
- **エージェント**: セキュリティ / パフォーマンス / 可読性 / テスト / アーキテクチャ（5並列）
- **適した場面**: PR 作成時のゲートチェック、初見スキャン、全体的な品質確認

### pr-review-toolkit（6専門エージェント）
- **性質**: 特定観点への深掘り
- **エージェント**:
  - `code-reviewer` — 全体的なコード品質・正確性
  - `pr-test-analyzer` — テストカバレッジ・テスト品質
  - `silent-failure-hunter` — エラーハンドリング・サイレント失敗
  - `type-design-analyzer` — 型システムの設計・活用度
  - `comment-analyzer` — コメント・ドキュメントの質
  - `code-simplifier` — 複雑なコードの簡略化提案
- **適した場面**: 特定の懸念がある、深く掘り下げたい

---

## ルーティング手順

### ステップ 1: 意図を読み取る

`$ARGUMENTS` が指定されている場合はそれを優先する。なければ直前の会話文脈からレビュー意図を読み取る。

### ステップ 2: シグナル判定

**code-review を選ぶシグナル:**
- 「ざっと見て」「quick scan」「全体確認」「PR 作成前チェック」
- 特定観点への言及がない
- 「まず」「最初に」などの初見レビューを示す語句

**pr-review-toolkit を選ぶシグナル（エージェント対応）:**
- 「型」「型設計」「型安全」→ `type-design-analyzer`
- 「エラーハンドリング」「例外」「握りつぶし」「サイレント失敗」→ `silent-failure-hunter`
- 「テスト品質」「カバレッジ」「テストが足りない」→ `pr-test-analyzer`
- 「コメント」「ドキュメント」「説明が少ない」→ `comment-analyzer`
- 「複雑すぎる」「シンプルにしたい」→ `code-simplifier`
- エージェント名の直接指定

### ステップ 3: 不明な場合は 1 問だけ質問する

シグナルが読み取れない場合:

> 「特定の観点（型設計・エラーハンドリング・テスト品質など）を確認したいですか？それとも全体的にざっとチェックしたいですか？」

回答を受けたら即座にルーティングし、再度質問しない。

### ステップ 4: 結果を出力する

以下の形式で出力する:

```
## レビューツール: [code-review | pr-review-toolkit]

**理由**: [1文でシグナルの説明]

**実行コマンド**:
[具体的なコマンドまたは呼び出し手順]
```

---

## 注意

- このスキルは**推薦を出すだけ**であり、ツールを直接起動しない
- 両方のプラグインがインストール済みであることを前提とする
