---
name: review-pr
description: Review a pull request or the current branch's changes against the base branch, focusing on correctness, security, and code quality
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[base-branch]"
---

現在のブランチの変更を確認し、コードレビューを行ってください。

## 手順

1. ベースブランチを特定する:
   - 引数 `$ARGUMENTS` が指定されている場合はそれを使う
   - なければ `git remote show origin` や `git log --oneline` から `main` または `master` を推測する

2. 変更内容を確認する:
   ```bash
   git diff <base-branch>...HEAD
   git log <base-branch>...HEAD --oneline
   ```

3. 変更されたファイルを読み込んで詳細を確認する

4. 以下の観点でレビューする:

   **正確性**
   - ロジックのバグ・エッジケースの見落とし
   - エラーハンドリングの抜け

   **セキュリティ**
   - インジェクション脆弱性（SQL・コマンド・XSS）
   - 認証・認可の問題
   - 機密情報のハードコード

   **コード品質**
   - 命名の明確さ
   - 関数・クラスの責務の分離
   - 重複コード
   - テストの有無・品質

   **パフォーマンス**
   - 不必要なループ・N+1クエリ
   - メモリリーク

5. レビュー結果を以下の形式で出力する:

## 出力フォーマット

```
## PR レビュー

### サマリー
<変更の概要と全体的な印象>

### 問題点

**[Critical]** `path/to/file.ts:42`
<問題の説明>
<修正案>

**[High]** ...
**[Medium]** ...
**[Low]** ...

### 改善提案（必須ではない）
- <提案>

### 承認コメント
<良い点・承認できる変更>
```

重大度の基準:
- `Critical`: セキュリティ脆弱性・データ損失リスク（マージ前に必ず修正）
- `High`: バグ・正確性の問題（マージ前に修正推奨）
- `Medium`: コード品質・保守性（対応推奨）
- `Low`: スタイル・マイナーな改善（任意）
