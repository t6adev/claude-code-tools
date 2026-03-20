# security-guidance

## 概要

PreToolUseフックを通じて9つのセキュリティパターンを監視するセキュリティガイダンスプラグイン。危険な操作をリアルタイムで検出・警告します。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/security-guidance/`
- Author: David Dworken (Anthropic)

## 採用理由

このリポジトリの `hooks/scripts/pre-tool/block-dangerous-rm.sh` と同じコンセプトだが、より広範な9つのセキュリティパターンをカバーする公式実装。個別スクリプトを管理するより一元化できる。

## インストール

```bash
claude plugin marketplace add anthropics/claude-code
claude plugin install anthropics/claude-code/plugins/security-guidance
```

## 提供機能

- PreToolUseフックによるリアルタイム監視
- 9種類のセキュリティパターン検出
- 危険な操作のブロック・警告

## 監視パターン（例）

- 危険な `rm` コマンド（`rm -rf /` 等）
- 機密ファイルへのアクセス
- 権限昇格を伴う操作
- その他セキュリティリスクのある操作
