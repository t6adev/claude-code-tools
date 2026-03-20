---
name: pre-pr-check
description: This skill should be used when the user asks to "PR を出す前に確認して", "check if this branch is ready to merge", "run pre-PR checks", "PRを作る前にチェックして", or wants to verify a branch before opening a pull request. Executes verification commands, validates Conventional Commits format, and confirms documentation is updated, then reports whether gh pr create is safe to run.
allowed-tools: Bash, Read, Grep
---

PR 作成前に品質を確認するチェックリスト。全項目クリアで「PR作成OK」と報告し、問題があれば修正を促す。

## Step 1: 変更の把握

`git diff main...HEAD --stat` でブランチ全体の変更ファイル一覧を取得する。
変更がない場合は「作業ブランチに変更がありません」と報告して終了する。

## Step 2: 検証コマンドの実行

以下の優先順位で検証コマンドを特定して実行する:

1. `CLAUDE.md` に記載されたコマンド（最優先）
2. `package.json` の `check` / `test` / `check:types` / `check:lint` スクリプト
3. 言語固有のデフォルト（`tsc --noEmit`、`eslint .` など）

検証コマンドが見つからない場合はその旨を報告してスキップする。

**失敗時の対処**:

- 実装に起因するエラー → 修正して再実行
- 環境依存エラー・既存の失敗 → ユーザーに報告してスキップ（PR作成は可能と判断）

## Step 3: コミットメッセージの確認

`git log main...HEAD --format="%s"` で対象ブランチのコミット一覧を取得する。

各コミットが Conventional Commits 形式に準拠しているか確認する:

- 形式: `<type>(<scope>): <description>`
- 有効な type: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `perf`, `ci`, `style`, `revert`

準拠していないコミットがある場合は一覧を提示してユーザーに確認を促す。

## Step 4: ドキュメント更新の確認

`git diff main...HEAD --name-only` で変更ファイルを確認し、以下を判定する:

- ソースコードが変更されているか（`src/`、`lib/`、`app/` 等）
- `docs/`・`CLAUDE.md`・`README.md` が更新されているか

ソースコードの変更があるのにドキュメントが無変更の場合、更新が必要かどうかを確認する。
「更新不要」と判断した場合はその理由を添えて続行する。

## Step 5: 結果の報告

| 項目         | 結果                  |
| ------------ | --------------------- |
| 検証コマンド | ✅ / ❌ / ⚠️ スキップ |
| コミット形式 | ✅ / ⚠️ 要確認        |
| ドキュメント | ✅ / ⚠️ 要確認        |

**全項目クリア**: 「PR作成OK です。`gh pr create` で PR を作成してください。」と報告する。
**問題あり**: 修正すべき項目を番号付きで提示し、修正後に再実行するよう促す。
