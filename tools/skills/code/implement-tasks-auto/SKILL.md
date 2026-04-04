---
name: implement-tasks-auto
description: This skill should be used when the user asks to "これらのIssueを全部実装して", "implement these issues autonomously", "Issue一覧を自動で片付けて", "これらのタスクを順番に実装してPRにして", or provides a list of GitHub Issue numbers/URLs for autonomous batch implementation. Fetches all specified Issues, resolves dependency order, then iterates through each — creating a worktree, implementing, and opening a PR — without user intervention.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent
argument-hint: "[#1 #2 #3 | issue-url1 issue-url2 ...]"
---

GitHub Issue のリストを受け取り、依存関係を解析した上で git worktree 内で自律的に実装し、PR を作成するスキル。
**独立した Issue は Agent tool で並列実行**し、依存関係のある Issue のみ直列で処理する。
すべてのタスクが完了するまでユーザー確認なしに進行する。

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール・認証済みであること
- ベースブランチ（`main` または `master`）が存在すること
- 操作パーミッションがすべて許可されていること

---

## Phase 0: Issue の取得と依存関係の解析

### Issue リストの一括取得

`$ARGUMENTS` から Issue 番号または URL のリストを抽出する。
**全 Issue の詳細を並列で取得する**（各 `gh issue view` を同時実行）:

```bash
# 各 Issue を並列取得（& でバックグラウンド実行、wait で待機）
for n in <numbers>; do
  gh issue view "$n" --json number,title,body,labels,assignees,milestone,url > "/tmp/issue-$n.json" &
done
wait
```

### 依存関係の解析

取得した全 Issue の本文・コメントを分析し、依存関係グラフを構築する。
詳細な解析手順は `${CLAUDE_SKILL_DIR}/references/dependency-resolution.md` を参照する。

**解析対象のシグナル:**

- `depends on #N`, `blocked by #N`, `requires #N`, `after #N`
- `#N に依存`, `#N の後に実施`, `#N が前提`
- 技術的な暗黙の依存（DB スキーマ変更 → それを使う機能、など）

**リスト外の依存 Issue**: 指定リスト外の Issue に依存している場合、その Issue もリストに追加して実装対象に含める。

### 実行計画の提示（レベル別）

依存関係をトポロジカルソートし、**並列実行レベル**に分割して実行順序を決定する。
同一レベル内の Issue は依存関係がなく、並列実行できる。

```
## 実行計画

### Level 0（並列実行）
- #10 feat: DB スキーマ追加 → base: main
- #11 fix: バリデーション修正 → base: main

### Level 1（Level 0 完了後に並列実行）
- #12 feat: API エンドポイント追加 → base: feat/10-db-schema
- #14 feat: 通知機能 → base: feat/11-validation

### Level 2（Level 1 完了後）
- #15 feat: UI コンポーネント追加 → base: feat/12-api-endpoint

### 依存関係グラフ
#10 → #12 → #15
#11 → #14
```

計画を出力した後、**確認を待たずに**実行を開始する。

---

## Phase 0.5: プロジェクトコンテキストの収集と共有

Agent は別コンテキストで動作するため、プロジェクト固有のパターンを知らない。
複数 Agent が同じ型エラーや規約違反を繰り返すことを防ぐため、
実装対象の Issue に関連する**プロジェクト固有のコードパターン**を事前に収集し、Agent に渡す。

### 収集対象

Issue の内容を分析し、関連する以下の情報を収集する:

1. **DB スキーマ / 型定義**: Issue が扱うテーブル・モデルの定義ファイル（`schema.ts`, `types.ts` 等）
2. **既存の類似コード**: 同じレイヤーの既存実装（例: 既存の CRUD API、既存コンポーネント）からパターンを抽出
3. **ヘルパー / ユーティリティ**: テストヘルパー、DB 操作ヘルパー、共通バリデーション等の使い方
4. **環境変数・設定の型**: `Env` 型定義、設定ファイルの構造

### 収集方法

```bash
# スキーマ / 型定義の特定
grep -rl "createTable\|defineTable\|schema\|interface.*Model" src/ --include="*.ts"

# 既存の類似実装パターンを 1 つ特定して読む
# （例: Issue が API エンドポイント追加なら既存の API ファイルを 1 つ読む）
```

収集した情報は **コードスニペット**として要約し（各パターン 10〜30 行程度）、全 Agent のプロンプトに含める。

### CLAUDE.md へのパターン記録

収集したパターンの中で、プロジェクト全体に適用される重要な規約やよくある落とし穴が
CLAUDE.md に記載されていない場合、**CLAUDE.md に追記する**。
これにより、今回の Agent だけでなく今後の開発でも同じミスを防げる。

追記の判断基準:

- 複数ファイルに一貫して適用されるパターン（型の使い方、DB 操作の作法など）
- 型定義と実際の使い方にギャップがある箇所（例: `timestamp` カラムに `Date` オブジェクトを渡す等）
- フレームワーク固有の注意点（ORM の戻り値の構造、SDK の API 仕様など）

追記先は CLAUDE.md の適切なセクション（なければ `## コード規約` セクションを作成）。
追記内容は簡潔にし、コード例を 1 つ添える。

---

## Phase 1: レベル別タスク実行

**レベル 0 から順に、各レベル内の Issue を並列実行する。**

### 並列実行数の制限（スライディングウィンドウ方式）

同時に実行中の Agent 数は **最大 3** に制限する。
バッチ単位で待機するのではなく、**スライディングウィンドウ方式**で逐次投入する:

- 最初に最大 3 件の Agent を `run_in_background: true` で起動する
- いずれかの Agent が完了通知を返したら、**即座に**次の未着手 Issue の Agent を起動する
- 常に「実行中 Agent 数 ≤ 3」を維持しながら、待ち時間を最小化する

```
例: Level 0 に 5 件（#10, #11, #12, #13, #14）ある場合
  1. #10, #11, #12 を同時起動（3 並列）
  2. #11 が完了 → 即座に #13 を起動（実行中: #10, #12, #13）
  3. #10 が完了 → 即座に #14 を起動（実行中: #12, #13, #14）
  4. 残り全完了を待つ
```

### 並列実行の仕組み

各 Issue に対して、Agent tool を `run_in_background: true` で起動する。
**初回は 1 つのメッセージ内で最大 3 件の Agent 呼び出しをまとめて送信する。**
以降は Agent の完了通知を受け取るたびに、次の Issue の Agent を 1 件ずつ起動する。

```
Agent(
  description: "Implement #10",
  prompt: "Issue #10 の実装タスク。以下の手順で自律実行する:
    1. worktree 作成（base: origin/main, branch: feat/10-db-schema）
    2. 依存インストール
    3. 実装（Issue 本文: ...）
    4. 検証（最大3回リトライ）
    5. コミット・プッシュ・PR 作成
    元リポジトリ: /path/to/repo
    ...",
  run_in_background: true
)
```

各 Agent には以下の情報を渡す:

- Issue の全文（本文・ラベル・タイトル）— Agent 内での `gh issue view` 再実行を省略するため
- ベースブランチとブランチ名
- 元リポジトリのパス
- CLAUDE.md の内容（プロジェクト規約）— Agent は別コンテキストのため
- worktree の事前準備コマンド
- プロジェクト固有のコードパターン（後述「プロジェクトコンテキストの収集と共有」参照）

### スライディングウィンドウの実行ループ

同一レベル内の実行ループ:

1. 未着手 Issue リストから最大 3 件を取り出し、`run_in_background: true` で同時起動する
2. Agent の完了通知を受け取ったら、結果（成功/失敗・PR URL・worktree パス）を記録する
3. 未着手 Issue が残っていれば、**即座に 1 件起動**して実行中 Agent 数を補充する
4. 全 Issue が完了するまで 2〜3 を繰り返す

**重要: 完了通知を受け取った同じレスポンス内で次の Agent を起動すること。**
「全部終わるまで待つ」のではなく「1 つ終わるたびに次を投入」する。

### レベル間の同期

各レベルの全 Issue が完了してから次のレベルに進む。
Agent の完了通知を受け取り、結果（成功/失敗・PR URL・worktree パス）を記録する。

依存先の Issue が失敗した場合でも、PR は作成済みのためブランチは存在する。
依存先のブランチをベースに作業を続行する。

### レベル完了の検証

Agent の「完了」は必ずしもタスクの完了を意味しない（権限不足やエラーで中途終了の場合がある）。
Agent 完了通知を受け取った後、各 worktree で以下を検証する:

1. `git log --oneline -1` でコミットが作成されたか確認
2. `gh pr list --head <branch>` で PR が作成されたか確認

**コミットまたは PR がない場合**、オーケストレーターが直接補完する:

1. worktree に cd し、Agent が書いたファイルの状態を `git status` で確認
2. `pnpm install`（未実行の場合）→ lint/format → 型チェック → テスト を実行
3. エラーがあれば修正（最大 3 回リトライ）
4. コミット → プッシュ → PR 作成

全 Issue の PR が作成されたことを確認してから次のレベルに進む。

### 依存先 PR のマージ検出

次のレベルに進む前に、前レベルの PR のマージ状態を確認する:

```bash
gh pr view <pr-number> --json state --jq '.state'
```

マージ済みの場合、依存先のブランチはもう不要。後続 Issue の対応:

1. `git fetch origin main`
2. 該当 worktree（未作成なら作成時に）ベースを `origin/main` に変更
3. 既に PR が作成済みなら `gh pr edit <number> --base main` でベースを更新
4. コンフリクトがあれば `git rebase origin/main` で解消する

---

## Phase 1.x: 各 Agent が実行するタスク詳細

各 Agent は以下のサイクルを自律実行する。

### 1. Worktree の作成

ベースブランチから worktree を作成する。
詳細は `${CLAUDE_SKILL_DIR}/references/worktree-workflow.md` を参照する。

`../<worktree-dir>` の `..` は **リポジトリルート（cwd）の親ディレクトリ**を指す。
`<worktree-dir>` はブランチ名の `/` を `-` に置換した文字列のみで、**余計なディレクトリ階層を追加しない**。

```bash
git fetch origin
git worktree add ../<worktree-dir> -b <branch-name> <base>
cd ../<worktree-dir>
```

**具体例:** リポジトリが `~/workspace/app-worktree/app` にある場合:

| ブランチ名         | コマンド                                                              | 作成先パス                                  |
| ------------------ | --------------------------------------------------------------------- | ------------------------------------------- |
| `feat/10-add-api`  | `git worktree add ../feat-10-add-api -b feat/10-add-api origin/main` | `~/workspace/app-worktree/feat-10-add-api`  |
| `fix/20-fix-login` | `git worktree add ../fix-20-fix-login -b fix/20-fix-login origin/main` | `~/workspace/app-worktree/fix-20-fix-login` |

**注意:** `../app-worktree/feat-10-add-api` のように親ディレクトリ名を含めてはならない。

### 2. 事前準備

worktree 内でプロジェクトの依存関係をインストールする。
ロックファイルの存在を確認して適切なコマンドを選択する（`pnpm install`, `go mod download` 等）。

### 3. 実装（implement-task の Phase 1〜5 を自律実行）

`/implement-task` スキルの以下のフェーズを**ユーザー確認なしに**順次実行する:

1. **Issue の理解**: 種別判定・完了条件の推論
2. **コードベースの探索**: 規約把握・関連コード特定
3. **実装計画**: ステップの策定（計画承認はスキップ）
4. **実装**: コード変更の実施
5. **検証**: テスト・型チェック・lint の実行

**自律実行時の判断基準:**

- 計画段階でのユーザー確認はスキップする
- 検証失敗時は最大 3 回まで修正を試みる
- 解決しない場合も PR は作成し、失敗内容を PR コメントに記録する

### 4. コミットと PR 作成

```bash
# リンター・フォーマッタ実行（CLAUDE.md / package.json の fix スクリプトに従う）

# コミット（Conventional Commits 形式）
git add -A
git commit -m "<type>(<scope>): <summary>" -m "Closes #<number>"

# プッシュ & PR 作成
git push -u origin <branch-name>
gh pr create --title "<type>(<scope>): <summary>" --body "..."
```

PR 本文・検証未通過時のコメントテンプレートは `${CLAUDE_SKILL_DIR}/references/templates.md` を参照する。

依存先がある場合、`gh pr create --base <parent-branch>` でベースブランチを指定する。
検証未通過の場合、`Closes` を `Refs` に変更して自動クローズを防ぐ。

### 5. 完了報告

Agent は最終結果を返す。元のオーケストレーターが結果を集約する。

---

## Phase 2: 完了レポート

すべてのレベルの実行が完了したら、最終レポートを出力する。
テンプレートは `${CLAUDE_SKILL_DIR}/references/templates.md` を参照する。

レポートには以下を含める:

- 成功した Issue と PR の一覧
- 要手動対応の Issue と問題の概要
- 依存関係を考慮したマージ順序
- Worktree のクリーンアップ手順

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
| Agent がエラー終了   | エラー内容を記録し、依存する後続 Issue の処理方針を判断する                              |

## Additional Resources

### Reference Files

- **`references/dependency-resolution.md`** — Issue 間の依存関係解析・トポロジカルソート・循環依存の検出・並列レベルの算出
- **`references/worktree-workflow.md`** — worktree のライフサイクル管理・依存ブランチからの分岐・マージ後のクリーンアップ
- **`references/templates.md`** — PR 本文・検証未通過コメント・完了レポートのテンプレート集

### 関連スキル

- **`/implement-task`** — 単一 Issue の実装フロー（Phase 1〜6）。本スキルは Phase 1〜5 の手順を参照する
- **`/workflow-planning`** — 計画・実行・検証サイクルの基本フレームワーク
