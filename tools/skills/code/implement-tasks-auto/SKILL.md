---
name: implement-tasks-auto
description: This skill should be used when the user asks to "これらのIssueを全部実装して", "implement these issues autonomously", "Issue一覧を自動で片付けて", "これらのタスクを順番に実装してPRにして", or provides a list of GitHub Issue numbers/URLs for autonomous batch implementation. Fetches all specified Issues, resolves dependency order, then iterates through each — creating a worktree, implementing, and opening a PR — without user intervention.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
argument-hint: "[#1 #2 #3 | issue-url1 issue-url2 ...]"
---

GitHub Issue のリストを受け取り、依存関係を解析した上で 1 件ずつ git worktree 内で自律的に実装し、PR を作成するスキル。
すべてのタスクが完了するまでユーザー確認なしに進行する。

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール・認証済みであること
- ベースブランチ（`main` または `master`）が存在すること
- 操作パーミッションがすべて許可されていること

---

## Phase 0: Issue の取得と依存関係の解析

### Issue リストの取得

`$ARGUMENTS` から Issue 番号または URL のリストを抽出し、各 Issue の詳細を取得する:

```bash
gh issue view <number> --json number,title,body,labels,assignees,milestone,url
```

### 依存関係の解析

取得した全 Issue の本文・コメントを分析し、依存関係グラフを構築する。
詳細な解析手順は `${CLAUDE_SKILL_DIR}/references/dependency-resolution.md` を参照する。

**解析対象のシグナル:**

- `depends on #N`, `blocked by #N`, `requires #N`, `after #N`
- `#N に依存`, `#N の後に実施`, `#N が前提`
- 技術的な暗黙の依存（DB スキーマ変更 → それを使う機能、など）

**リスト外の依存 Issue の扱い:**

指定リスト外の Issue に依存している場合、その Issue もリストに追加して実装対象に含める。
追加した Issue はログに記録する。

### 実行計画の提示

依存関係を解析した結果をトポロジカルソートし、実行順序を決定する。
以下の形式で計画を出力する:

```
## 実行計画

### 実行順序（依存関係順）

1. #10 feat: DB スキーマ追加（依存なし）
   → ベースブランチ: main
2. #12 feat: API エンドポイント追加（depends on #10）
   → ベースブランチ: feat/10-db-schema
3. #11 fix: バリデーション修正（依存なし）
   → ベースブランチ: main
4. #15 feat: UI コンポーネント追加（depends on #12）
   → ベースブランチ: feat/12-api-endpoint

### 依存関係グラフ

#10 → #12 → #15
#11（独立）

### 追加された Issue

- #10: #12 の本文に "depends on #10" と記載されていたため追加
```

計画を出力した後、**確認を待たずに**実行を開始する。

---

## Phase 1: タスクループ

実行計画の順序に従い、各 Issue に対して以下のサイクルを繰り返す。

### 1.1 Worktree の作成

依存関係に応じてベースブランチを決定し、worktree を作成する。
詳細は `${CLAUDE_SKILL_DIR}/references/worktree-workflow.md` を参照する。

**ベースブランチの決定ルール:**

| 条件              | ベースブランチ                                     |
| ----------------- | -------------------------------------------------- |
| 依存なし          | `main`（または `master`）                          |
| 他の Issue に依存 | 依存先 Issue のブランチ（PR が作成済みであること） |

```bash
git fetch origin
git worktree add ../<worktree-dir> -b <branch-name> <base>
cd ../<worktree-dir>
```

### 1.2 事前準備

worktree 内でプロジェクトの依存関係をインストールする:

- `package.json` → `pnpm install`（または `npm install` / `yarn install`）
- `go.mod` → `go mod download`
- `pyproject.toml` → `pip install -e .` / `poetry install`
- `Cargo.toml` → `cargo fetch`

### 1.3 実装（implement-task の Phase 1〜5 を自律実行）

`/implement-task` スキルの以下のフェーズを**ユーザー確認なしに**順次実行する:

1. **Issue の理解**（Phase 1）: 種別判定・完了条件の推論
2. **コードベースの探索**（Phase 2）: 規約把握・関連コード特定
3. **実装計画**（Phase 3）: ステップの策定（計画承認はスキップ）
4. **実装**（Phase 4）: コード変更の実施
5. **検証**（Phase 5）: テスト・型チェック・lint の実行

**自律実行時の判断基準:**

- 計画段階でのユーザー確認はスキップする
- 破壊的変更（API・DB スキーマ）も計画通りなら実行する
- 検証失敗時は最大 3 回まで修正を試みる。解決しない場合も PR は作成し、失敗内容を PR コメントに記録する（1.4 参照）

### 1.4 コミットと PR 作成

```bash
# リンター・フォーマッタ実行
# （CLAUDE.md / package.json の fix スクリプトに従う）

# コミット（Conventional Commits 形式）
git add -A
git commit -m "<type>(<scope>): <summary>" -m "Closes #<number>"

# プッシュ & PR 作成
git push -u origin <branch-name>
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

依存先がある場合、PR のベースブランチを依存先のブランチに設定する:

```bash
gh pr create --base <parent-branch> ...
```

#### 検証未通過の場合

検証が通らなかった場合も PR は作成する。ただし以下を行う:

1. コミットメッセージの `Closes` を `Refs` に変更する（自動クローズを防ぐ）
2. PR 作成後にコメントで未解決の問題を報告する:

```bash
gh pr comment <pr-number> --body "$(cat <<'COMMENTEOF'
## ⚠️ 検証未通過

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

### 1.5 Worktree の保持

Worktree は削除せず残す。ユーザーが後から修正を加える可能性があるため。
作業ディレクトリを元のリポジトリルートに戻してから次のタスクへ進む:

```bash
cd <original-repo-dir>
```

### 1.6 次のタスクへ

ループの先頭に戻り、次の Issue の worktree を作成する。

---

## Phase 2: 完了レポート

すべてのタスクが完了したら、最終レポートを出力する:

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

---

## ブランチ命名規則

- ブランチ名: `<type>/<issue-number>-<short-description>`
  - 例: `feat/42-user-auth`, `fix/38-session-leak`
- Worktree ディレクトリ名: ブランチ名の `/` を `-` に置換
  - 例: `feat-42-user-auth`

## エラーハンドリング

| 状況                 | 対応                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- |
| Issue 取得失敗       | その Issue をスキップし、依存先として必要な Issue がある場合はそれもスキップ             |
| 循環依存を検出       | 循環に含まれる Issue を報告し、ユーザーに解決を委ねる                                    |
| 検証が 3 回失敗      | PR を作成し、コメントで失敗内容と修正試行の詳細を記録                                    |
| worktree 作成失敗    | 既存 worktree の確認・再利用を試みてリトライ                                             |
| 依存先の検証が未通過 | 依存先の PR は作成済みのためブランチは存在する。依存先のブランチをベースに作業を続行する |

## Additional Resources

### Reference Files

- **`references/dependency-resolution.md`** — Issue 間の依存関係解析・トポロジカルソート・循環依存の検出方法
- **`references/worktree-workflow.md`** — worktree のライフサイクル管理・依存ブランチからの分岐・マージ後のクリーンアップ

### 関連スキル

- **`/implement-task`** — 単一 Issue の実装フロー（Phase 1〜6）。本スキルは Phase 1〜5 の手順を参照する
- **`/workflow-planning`** — 計画・実行・検証サイクルの基本フレームワーク
