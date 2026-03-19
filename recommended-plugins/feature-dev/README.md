# feature-dev

## 概要

7フェーズの体系的なフィーチャー開発ワークフロー。コードベース探索から設計・実装・品質レビューまでを構造化されたプロセスで進められます。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/feature-dev/`
- Author: Sid Bidasaria (Anthropic)

## 採用理由

このリポジトリの `/workflow-planning` skill と似たコンセプトだが、専門エージェントによるコードベース探索・アーキテクチャ設計が組み込まれており、複数ファイルをまたぐ機能開発に特に有効。

## インストール

```bash
claude plugin install anthropics/claude-code/plugins/feature-dev
```

## 提供コマンド / エージェント

| コマンド/エージェント | 説明 |
|---|---|
| `/feature-dev` | 7フェーズ開発ワークフローを開始 |
| `code-explorer` | コードベース探索・既存実装の調査 |
| `code-architect` | アーキテクチャ設計・技術的判断 |
| `code-reviewer` | 実装品質の並列レビュー（3並列） |

## 7フェーズワークフロー

1. **Discovery** - 要件の明確化
2. **Codebase Exploration** - 既存コードの調査（code-explorerエージェント）
3. **Clarifying Questions** - 不明点の確認
4. **Architecture Design** - 設計決定
5. **Implementation** - 実装
6. **Quality Review** - 品質レビュー（3並列 code-reviewer）
7. **Summary** - 変更内容のまとめ
