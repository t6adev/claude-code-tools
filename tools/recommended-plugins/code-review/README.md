# code-review

## 概要

PR のコードレビューを自動化します。複数の専門エージェントを並列実行し、セキュリティ・パフォーマンス・可読性など多角的な観点からレビューします。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/code-review/`
- Author: Anthropic

## 採用理由

このリポジトリの `agents/review/code-reviewer` より多角的・並列化されたレビューを提供する。
5つの専門エージェントが並列でレビューするため、網羅性と速度を両立できる。

## インストール

インストーラーが [`plugin.yaml`](plugin.yaml) を自動認識してインストールします。

```bash
npx github:t6adev/claude-code-tools
```

手動インストールする場合:

```bash
claude plugin marketplace add anthropics/claude-code  # registry の登録
claude plugin install code-review@claude-code-plugins  # <plugin_id>@<channel>
```

## 提供コマンド / 機能

| コマンド              | 説明                                       |
| --------------------- | ------------------------------------------ |
| `/code-review:review` | 現在の変更差分を並列エージェントでレビュー |

**レビュー観点（並列実行）:**

1. セキュリティ（脆弱性・認証・権限）
2. パフォーマンス（計算量・メモリ・I/O）
3. 可読性・保守性（命名・構造・コメント）
4. テスト（カバレッジ・エッジケース）
5. アーキテクチャ（設計・依存関係）
