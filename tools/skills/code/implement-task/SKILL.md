---
name: implement-task
description: This skill should be used when the user asks to "このIssueを実装して", "implement this issue", "fix this bug", "このタスクをやって", "Issue #N を対応して", or provides a GitHub Issue URL or number and asks for it to be resolved. Fetches the GitHub Issue, explores the relevant codebase, produces an implementation plan for user approval, writes and validates the changes, then opens a PR linked to the Issue.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
argument-hint: "[issue-url | #number | (no args = list open issues)]"
---

GitHub Issue を起点に、コードの実装から PR 作成までを一貫して行うスキル。

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール・認証済みであること
- ベースブランチ（`main` または `master`）が存在すること

---

## Phase 0: Issue の特定

`$ARGUMENTS` の内容によって分岐する。

### 引数がある場合

`$ARGUMENTS` が以下のいずれかの形式であることを確認する:

- GitHub Issue URL（例: `https://github.com/org/repo/issues/42`）
- Issue 番号（例: `42` または `#42`）

どちらの形式でも `gh issue view <number> --json number,title,body,labels,assignees,milestone,url` で Issue の詳細を取得する。

取得に失敗した場合（Issue が見つからない、認証エラーなど）は、エラーの原因をユーザーに伝えて終了する。

### 引数がない場合

以下を実行してオープンな Issue をリストアップし、ユーザーに選択を促す:

```bash
gh issue list --state open --limit 20 --json number,title,labels,assignees,milestone
```

表示形式:

```
オープンな Issue 一覧:

#42  feat: ユーザー認証の実装  [enhancement]
#38  fix: ログアウト後にセッションが残る  [bug]
#35  chore: CI/CD の構築  [infrastructure]

実装する Issue の番号を入力してください（例: 42）:
```

ユーザーが番号を入力したら、その Issue を取得して次のフェーズへ進む。

---

## Phase 1: Issue の理解

取得した Issue から以下の情報を整理する。

### 種別の判定

| ラベル                    | 種別               | ブランチ prefix      |
| ------------------------- | ------------------ | -------------------- |
| `bug`                     | バグ修正           | `fix/`               |
| `enhancement` / `feature` | 機能追加           | `feat/`              |
| `chore` / `refactor`      | 改善               | `chore/`             |
| ラベルなし                | Issue 本文から判断 | 判断結果に応じて選ぶ |

### 完了条件の確認

Issue 本文に受け入れ基準（Acceptance Criteria）が記載されている場合はそれを抜き出す。
記載がない場合は Issue 本文から完了条件を推論して提示し、ユーザーに確認する。

例:

```
この Issue の完了条件を以下のように解釈しました:
- ログアウト後にセッションが破棄される
- ログアウト後に保護されたページへのアクセスが拒否される

合っていますか？
```

### 既存 PR の確認

```bash
gh pr list --search "closes #<number>"
```

既存 PR がある場合はユーザーに提示して、引き継ぐか新規作業するか確認する。

---

## Phase 2: コードベースの探索

Issue の内容をもとに、実装に必要なコードを特定する。

### 探索の順序

1. **プロジェクト規約の把握**: `CLAUDE.md`、`docs/architecture.md`、`docs/requirements.md` が存在する場合は必ず読む
2. **キーワード検索**: Issue 本文・タイトルに含まれるキーワードで Grep する
3. **関連ファイルの精読**: 候補に絞ったファイルのみ Read する

バグ修正の場合は問題が発生しているファイル・関数を特定して再現条件を理解する。
機能追加の場合は追加箇所に最も近い既存コードのパターンを把握する。

探索戦略の詳細は `${CLAUDE_SKILL_DIR}/references/codebase-exploration.md` を参照する。

### 探索完了の判断基準

以下がすべて揃った時点で Phase 3 へ進む:

- 変更対象ファイルが特定できた
- プロジェクト固有の規約（命名規則・テスト方針など）を把握した
- 類似実装のパターンを把握した（機能追加の場合）
- 問題の原因箇所を特定した（バグ修正の場合）

---

## Phase 3: 実装計画

探索結果をもとに実装計画を立てる。

### 計画の書き出し

`tasks/todo.md` に以下の形式でチェックリストを作成する（ファイルが存在しない場合は新規作成する）。
プロジェクトに別のタスクトラッキング規約がある場合（`.tasks/`、`TODO.md` 直下など）はそちらに合わせる。

```markdown
## Issue #<number>: <title> - <YYYY-MM-DD>

### 完了条件

- <Phase 1 で確認した受け入れ基準>

### 実装ステップ

- [ ] ステップ1: <具体的な作業内容>（対象: `src/auth/session.ts`）
- [ ] ステップ2: <具体的な作業内容>（対象: `src/middleware/auth.ts`）
- [ ] テスト追加: <テストの概要>
- [ ] 検証: テスト・型チェック・lint を全通過

### 作業ブランチ

- `fix/38-session-not-destroyed-on-logout`
```

### 計画の品質チェック

計画を書いた後、以下を確認してから提示する:

- 各ステップに「対象ファイル」が明示されているか
- 完了条件と実装ステップが対応しているか
- 計画通りに実行すれば Issue がクローズできるか

### ユーザー確認

計画を表示して確認を取り、**承認されるまで実装を開始しない**。
修正が必要な場合はユーザーの指示に従って計画を修正してから再確認する。

---

## Phase 4: 実装

ユーザーが計画を承認したら作業ブランチを作成し、実装を開始する。

### ブランチ作成

```bash
git checkout -b <branch-name>
```

ブランチ名の形式: `<type>/<issue-number>-<short-description>`（例: `feat/42-user-auth`、`fix/38-session-leak`）

### 実装のルール

- 各ステップ完了時に `tasks/todo.md` のチェックを更新し、変更内容の要約を添える
- うまくいかなくなったら**即座に停止して再計画**する。無理に突き進まない
- 当初の計画では不十分だと気づいたら、計画を修正してからユーザーに共有する

### 自律性の境界

| 確認なしに進めてよい                                     | 実装前にユーザーへ確認する                         |
| -------------------------------------------------------- | -------------------------------------------------- |
| 計画で合意済みのステップ                                 | 破壊的変更（API・DB スキーマ変更）                 |
| 明確なバグ修正（エラー・テスト失敗を自分で特定した場合） | 計画にないファイルや依存関係の追加                 |
| CI の失敗テストの修正                                    | アーキテクチャレベルの判断（新ライブラリ導入など） |

### 実装の品質

非自明な変更では、提示する前に「より良い方法はないか」と立ち止まる。修正がハック的に感じたら、今知っている情報すべてを踏まえてよりエレガントな解決策を検討する。ただし、単純で明白な修正にはこのチェックをスキップする。過剰設計しない。

---

## Phase 5: 検証

実装完了後、プロジェクトに合った検証コマンドを特定して実行する。

検証コマンドの特定方法と言語別のデフォルトコマンドは `${CLAUDE_SKILL_DIR}/references/verification.md` を参照する。

### 検証の順序

1. `CLAUDE.md` に記載されたコマンドがあればそれを実行（最優先）
2. `package.json` の `check` / `test` / `check:types` / `check:lint` 等を実行
3. 言語固有のデフォルトツールを使用（Go, Python, Rust など）

### 失敗時の対処

実装に起因するエラーは修正して再実行する。環境依存のエラーや自分の変更前から存在していた失敗はユーザーに報告して判断を仰ぐ。修正後は**必ずすべての検証コマンドを再実行する**。

---

## Phase 6: コミットと PR 作成

### コミット

変更をステージングしてコミットする。Conventional Commits 形式で、`Closes #<issue-number>` を必ず含める。

例: `git commit -m "feat(auth): add session invalidation on logout" -m "Closes #38"`

- type: `feat` / `fix` / `chore` / `refactor` / `docs` / `test`
- scope: 変更の主要なファイル・モジュール名（省略可）
- 50文字以内

### PR 作成

```bash
git push -u origin <branch-name>
gh pr create \
  --title "<type>(<scope>): <summary>" \
  --body "$(cat <<'EOF'
## 概要

<Issue の内容と実装アプローチの要約>

## 変更内容

- <主要な変更点をリストアップ>

## 検証

- [ ] テスト通過
- [ ] 型チェック通過
- [ ] lint 通過

## 関連 Issue

Closes #<issue-number>
EOF
)"
```

PR 作成後に URL を表示してユーザーに伝える。

---

## 完了チェックリスト

- [ ] Issue の内容と完了条件をユーザーと合意した
- [ ] 実装計画をユーザーが承認した
- [ ] すべての検証コマンドが通過した
- [ ] コミットに `Closes #<number>` が含まれている
- [ ] PR が作成され、Issue にリンクされた
- [ ] `tasks/todo.md` が最終状態に更新された

---

## Additional Resources

### Reference Files

- **`references/codebase-exploration.md`** — ツールの使い分け・プロジェクト規模別の探索戦略・探索完了の判断基準
- **`references/verification.md`** — 言語別の検証コマンド・失敗時の対処・既存失敗の区別方法
