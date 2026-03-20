# plugin-dev

## 概要

Claude Code プラグイン開発に特化したツールキット。Skill・Agent・Hook・MCP 統合・プラグイン構造の設計まで、プラグイン作成に必要な知識を7つの専門スキルで網羅する。

## ソース

- Repository: https://github.com/anthropics/claude-plugins-official
- Plugin path: `plugins/plugin-dev/`
- Author: Daisy Hollman (Anthropic)

## 採用理由

このリポジトリで Skill・Agent・Hook・MCP を追加・改善する際に、公式のベストプラクティスを直接参照できる。`/plugin-dev:create-plugin` コマンドによる 8 フェーズのガイド付きワークフローにより、新規ツール追加の品質と一貫性が向上する。

## インストール

`plugin.yaml` は `enabled: false` のため、インストーラーのデフォルトインストール対象外です。
必要に応じて手動でインストールしてください:

```bash
claude plugin marketplace add anthropics/claude-plugins-official
claude plugin install plugin-dev@claude-code-marketplace
```

## 提供コマンド / スキル

| コマンド/スキル             | 説明                                                  |
| --------------------------- | ----------------------------------------------------- |
| `/plugin-dev:create-plugin` | 8フェーズのガイド付きプラグイン作成ワークフロー       |
| `skill-development`         | Skill の作成・改善（Progressive Disclosure パターン） |
| `agent-development`         | Agent の作成（AI アシスト生成対応）                   |
| `command-development`       | スラッシュコマンドの作成                              |
| `hook-development`          | Hook の実装・検証（ユーティリティスクリプト付き）     |
| `mcp-integration`           | MCP サーバーの統合（stdio/SSE/HTTP/WebSocket）        |
| `plugin-structure`          | プラグインのディレクトリ構成・マニフェスト設定        |
| `plugin-settings`           | `.claude/plugin-name.local.md` によるプロジェクト設定 |

## このリポジトリでの活用方法

| 作業                             | 使うスキル                  |
| -------------------------------- | --------------------------- |
| 新しい Skill を追加したい        | `skill-development`         |
| 新しい Agent を追加したい        | `agent-development`         |
| Hook スクリプトを書きたい        | `hook-development`          |
| MCP 設定テンプレートを追加したい | `mcp-integration`           |
| 新規プラグインを一から作りたい   | `/plugin-dev:create-plugin` |
