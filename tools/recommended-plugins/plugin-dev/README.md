# plugin-dev

## 概要

Claude Codeプラグイン開発専用のツールキット。フック・MCP統合・プラグイン構造・設定・コマンド・エージェント・スキルの7つの専門スキルと、8フェーズの開発ワークフローを提供します。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/plugin-dev/`
- Author: Anthropic

## 採用理由

このリポジトリ自体がプラグインライブラリであり、新しいプラグインを開発する際に直接活用できる。11,000語超のスキル定義と10,000語超のリファレンスを備えた包括的な開発ガイド。

## インストール

```bash
claude plugin install anthropics/claude-code/plugins/plugin-dev
```

## 提供コマンド / スキル

| コマンド/スキル | 説明 |
|---|---|
| `/plugin-dev:create-plugin` | 8フェーズでプラグインを新規作成 |
| `hooks` スキル | フックの設計・実装ガイダンス |
| `mcp` スキル | MCP統合の設計・実装ガイダンス |
| `structure` スキル | プラグイン構造の設計 |
| `settings` スキル | 設定管理のガイダンス |
| `commands` スキル | スラッシュコマンドの作成 |
| `agents` スキル | エージェントの定義・設計 |
| `skills` スキル | スキルの定義・設計 |

## 8フェーズ開発プロセス

1. 要件定義
2. 構造設計
3. コマンド実装
4. エージェント実装
5. フック実装
6. MCP統合
7. 設定・権限設定
8. ドキュメント作成
