# code-reviewer

コードレビュー専門のサブエージェントです。セキュリティ・正確性・保守性の観点から変更を分析します。

## 使い方

Claude Code から以下のように呼び出します:

```
コードレビューをしてください
```

または明示的に呼び出す場合:

```
@code-reviewer で現在のブランチをレビューしてください
```

## レビュー観点

| 観点 | 内容 |
|---|---|
| セキュリティ | インジェクション・認証バイパス・機密情報漏洩 |
| 正確性 | ロジックバグ・エラーハンドリング・競合状態 |
| 保守性 | 命名・単一責任・重複コード |
| テスト | テストの有無・カバレッジ・品質 |
| パフォーマンス | N+1クエリ・メモリリーク |

## 出力例

```
## コードレビュー

### サマリー
JWT認証の実装です。全体的に良い実装ですが、セキュリティ上の懸念が1件あります。

### 問題点

**[Critical]** `src/auth/middleware.ts:34`
トークンの検証に非定数時間比較を使用しています。
タイミング攻撃に脆弱です。

修正案:
```ts
import { timingSafeEqual } from 'crypto'
// 文字列比較の代わりに timingSafeEqual を使用
```

### 良い点
- リフレッシュトークンのローテーションが適切に実装されています

### 全体評価
Request Changes
Critical な問題を修正後、再レビューをお願いします。
```

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/agents/review/code-reviewer ~/.claude/agents/code-reviewer

# プロジェクト
cp -r ~/path/to/claude-code-tools/agents/review/code-reviewer .claude/agents/
```
