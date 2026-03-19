# review-pr

現在のブランチの変更をベースブランチと比較し、コードレビューを行います。

## 使い方

```
/review-pr [base-branch]
```

## 例

```bash
# ベースブランチを自動推測
/review-pr

# ベースブランチを明示指定
/review-pr main
/review-pr develop
```

## 出力例

```
## PR レビュー

### サマリー
認証フローにJWT refresh tokenを追加する変更です。概ね問題ありませんが、
セキュリティ上の懸念が1件あります。

### 問題点

**[High]** `src/auth/token.ts:87`
リフレッシュトークンの有効期限チェックが欠落しています。
期限切れトークンでも新しいアクセストークンが発行されてしまいます。

修正案:
```ts
if (token.expiresAt < Date.now()) {
  throw new TokenExpiredError()
}
```

### 承認コメント
- トークンのハッシュ化が適切に実装されています
- エラーハンドリングが丁寧です
```

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/skills/git/review-pr ~/.claude/skills/review-pr

# プロジェクト（コピー）
cp -r ~/path/to/claude-code-tools/skills/git/review-pr .claude/skills/
```
