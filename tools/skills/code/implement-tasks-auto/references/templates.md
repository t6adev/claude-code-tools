# テンプレート集

## PR 本文テンプレート

```bash
gh pr create \
  --title "<type>(<scope>): <summary>" \
  --body "$(cat <<'PREOF'
## 概要

<Issue の内容と実装アプローチの要約>

## 変更内容

- <主要な変更点>

## 検証

- [x/空] テスト通過
- [x/空] 型チェック通過
- [x/空] lint 通過

## 関連 Issue

Closes #<number>
PREOF
)"
```

依存先がある場合、`--base <parent-branch>` を追加する。

---

## 検証未通過時の PR コメントテンプレート

検証が通らなかった場合も PR は作成する。ただし以下を行う:

1. コミットメッセージの `Closes` を `Refs` に変更する（自動クローズを防ぐ）
2. PR 作成後にコメントで未解決の問題を報告する:

```bash
gh pr comment <pr-number> --body "$(cat <<'COMMENTEOF'
## 検証未通過

以下の問題が未解決のため、手動対応が必要です。

### 失敗内容

- <具体的なエラーメッセージ・失敗したテスト名>

### 試みた修正（3回）

1. <1回目の修正内容と結果>
2. <2回目の修正内容と結果>
3. <3回目の修正内容と結果>

### 推奨される対応

- <問題の原因の推測と修正方針>

Worktree は `../<worktree-dir>` に残してあります。
COMMENTEOF
)"
```

---

## 完了レポートテンプレート

```
## 完了レポート

### 成功（検証通過・PR 作成済み）

| Issue | PR | ブランチ | Worktree |
|-------|----|---------|----------|
| #10 feat: DB スキーマ追加 | #20 | feat/10-db-schema | ../feat-10-db-schema |
| #11 fix: バリデーション修正 | #22 | fix/11-validation | ../fix-11-validation |

### 要手動対応（検証未通過・PR 作成済み）

| Issue | PR | 問題 | Worktree |
|-------|----|------|----------|
| #15 feat: UI コンポーネント | #23 | TypeScript エラー | ../feat-15-ui-component |

### マージ順序

依存関係のある PR は以下の順序でマージすること:
1. #20 (feat/10-db-schema) → main
2. #21 (feat/12-api-endpoint) → main（#20 マージ後にベース更新）
3. #22 (fix/11-validation) → main（独立、任意のタイミング）

### Worktree のクリーンアップ

PR がマージされた worktree は以下のコマンドで削除できます:
git worktree remove ../<worktree-dir>

全 worktree を一括で確認:
git worktree list
```
