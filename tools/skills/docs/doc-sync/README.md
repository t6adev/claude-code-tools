# doc-sync

実装変更に合わせて `CLAUDE.md`・`docs/architecture.md`・`README.md` 等を更新するスキル。

## 使い方

```
/doc-sync [feature-description]
```

引数なしで呼び出すと `git diff main...HEAD` から変更を自動検出します。

## 例

```
# git diff から自動検出
/doc-sync

# 機能の説明を直接渡す
/doc-sync "ユーザー認証機能を追加。JWT ベースで /api/auth エンドポイントを新設"
```

## 動作

1. git diff または引数から変更内容を把握
2. `CLAUDE.md`・`docs/architecture.md`・`docs/requirements.md`・`README.md` を読み込み
3. 更新が必要な箇所を特定して更新案を提示
4. ユーザーの承認を得てから適用（ファイルごとに個別承認）

## start-webapp / implement-task との関係

`/start-webapp` で作成したドキュメントを、`/implement-task` で実装を進めた後に最新状態へ同期するために使います。PR作成前の `/pre-pr-check` と組み合わせると効果的です。
