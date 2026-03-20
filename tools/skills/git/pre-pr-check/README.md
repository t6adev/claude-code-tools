# pre-pr-check

PR作成前に品質を自動チェックするスキル。検証コマンドの実行・コミット形式確認・ドキュメント更新確認を一括で行います。

## 使い方

```
/pre-pr-check
```

引数は不要です。カレントブランチの状態を自動で確認します。

## 例

```
/pre-pr-check
```

## 動作

1. `git diff main...HEAD` で変更を把握
2. `pnpm check` 等の検証コマンドを実行
3. コミットメッセージが Conventional Commits 形式か確認
4. `docs/` や `CLAUDE.md` の更新有無を確認
5. 全項目クリアなら「PR作成OK」、問題があれば修正箇所を提示

## implement-task との関係

`/implement-task` で実装が完了した後、`gh pr create` の前に使うと効果的です。
