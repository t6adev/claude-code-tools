# pr-review-toolkit

## 概要

6つの専門エージェントによる包括的なPRレビューツールキット。コードレビュー・テスト分析・エラーハンドリング・型設計・コード簡略化を並列で実施できます。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/pr-review-toolkit/`
- Author: Daisy Hollman (Anthropic)

## 採用理由

このリポジトリの `agents/review/code-reviewer` より専門化されており、6つのエージェントがそれぞれ異なる観点でレビューを担当する。単一エージェントでは見落としがちな観点（テスト品質・サイレント失敗・型設計）をカバーできる。

## インストール

インストーラーが [`plugin.yaml`](plugin.yaml) を自動認識してインストールします。

```bash
npx github:t6adev/claude-code-tools
```

手動インストールする場合:

```bash
claude plugin marketplace add anthropics/claude-code  # registry の登録
claude plugin install pr-review-toolkit@claude-code-plugins  # <plugin_id>@<channel>
```

## 提供エージェント

| エージェント            | 説明                                         |
| ----------------------- | -------------------------------------------- |
| `code-reviewer`         | 全体的なコード品質・正確性・保守性のレビュー |
| `pr-test-analyzer`      | テストカバレッジ・テスト品質の分析           |
| `silent-failure-hunter` | エラーを握りつぶすコードパターンの検出       |
| `type-design-analyzer`  | 型システムの設計・活用度の評価               |
| `comment-analyzer`      | コメント・ドキュメントの質の評価             |
| `code-simplifier`       | 複雑すぎるコードの簡略化提案                 |

## 推奨ワークフロー

1. `code-reviewer` で全体レビュー
2. `silent-failure-hunter` でエラーハンドリング確認
3. `pr-test-analyzer` でテスト品質確認
4. `comment-analyzer` でドキュメント確認
5. `code-simplifier` で最終的な簡略化チェック
