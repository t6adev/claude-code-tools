# Worktree ワークフローガイド

## Worktree のライフサイクル

```
作成 → 依存インストール → 実装 → コミット → プッシュ → PR作成 → 保持
                                                                    ↓
                                                          PRマージ後に削除
```

Worktree は PR がマージされるまで残す。ユーザーが後から修正を加えたり、レビュー指摘に対応する際に利用できるようにするため。

---

## Worktree の作成

### 基本コマンド

```bash
# リモートの最新を取得
git fetch origin

# worktree を作成（ブランチも同時に作成）
git worktree add ../<worktree-dir> -b <branch-name> <base-ref>
```

### ディレクトリ名の決定

ブランチ名の `/` を `-` に置換した文字列を使う:

| ブランチ名            | Worktree ディレクトリ    |
| --------------------- | ------------------------ |
| `feat/42-user-auth`   | `../feat-42-user-auth`   |
| `fix/38-session-leak` | `../fix-38-session-leak` |
| `chore/10-ci-setup`   | `../chore-10-ci-setup`   |

### ベースの指定

| 依存関係                     | base-ref                                |
| ---------------------------- | --------------------------------------- |
| 依存なし                     | `origin/main`（または `origin/master`） |
| #10 に依存                   | `feat/10-db-schema`（ローカルブランチ） |
| #10 → #12 に依存（チェーン） | `feat/12-api-endpoint`（直近の依存先）  |

依存先ブランチをベースにする場合、そのブランチが既にプッシュ済みであることを確認する:

```bash
git branch -r | grep <parent-branch>
```

存在しなければ `git push origin <parent-branch>` を先に実行する。

---

## 依存チェーンの分岐パターン

### 独立タスク

```
main ─── feat/10-db-schema      (worktree: ../feat-10-db-schema)
    └─── fix/11-validation      (worktree: ../fix-11-validation)
```

各 worktree は `origin/main` からブランチを作成する。

### 直列依存

```
main ─── feat/10-db-schema ─── feat/12-api-endpoint ─── feat/15-ui-component
```

```bash
# 1つ目: main からブランチ
git worktree add ../feat-10-db-schema -b feat/10-db-schema origin/main

# 2つ目: #10 のブランチからブランチ
git worktree add ../feat-12-api-endpoint -b feat/12-api-endpoint feat/10-db-schema

# 3つ目: #12 のブランチからブランチ
git worktree add ../feat-15-ui-component -b feat/15-ui-component feat/12-api-endpoint
```

### 扇型依存（1つの親に複数の子）

```
main ─── feat/10-db-schema ─┬── feat/12-api-endpoint
                            └── feat/13-batch-job
```

```bash
git worktree add ../feat-10-db-schema -b feat/10-db-schema origin/main
git worktree add ../feat-12-api-endpoint -b feat/12-api-endpoint feat/10-db-schema
git worktree add ../feat-13-batch-job -b feat/13-batch-job feat/10-db-schema
```

---

## 事前準備（依存インストール）

Worktree は `node_modules` や `.venv` を持たない状態で作成される。コード変更前に必ず依存関係をインストールする。

### 検出と実行

以下の順でファイルを確認し、最初に見つかったものを実行する:

| ファイル                             | コマンド           |
| ------------------------------------ | ------------------ |
| `pnpm-lock.yaml`                     | `pnpm install`     |
| `yarn.lock`                          | `yarn install`     |
| `package-lock.json`                  | `npm install`      |
| `package.json`（ロックファイルなし） | `npm install`      |
| `go.mod`                             | `go mod download`  |
| `pyproject.toml` + `poetry.lock`     | `poetry install`   |
| `pyproject.toml`                     | `pip install -e .` |
| `Cargo.toml`                         | `cargo fetch`      |

複数の言語が混在するリポジトリでは、該当するすべてのコマンドを実行する。

---

## PR 作成時のベースブランチ指定

依存先がある Issue の PR は、`--base` オプションで依存先のブランチを指定する:

```bash
# 独立タスク → main がベース（デフォルト）
gh pr create --title "..." --body "..."

# 依存タスク → 親ブランチがベース
gh pr create --base feat/10-db-schema --title "..." --body "..."
```

これにより、PR の diff が親ブランチからの差分のみを表示し、レビューしやすくなる。

---

## 実行中の依存先 PR マージへの対応

ユーザーや CI が親 PR をマージすると、子 Issue のベースブランチが消える。
次レベルの Agent を起動する前に、前レベルの PR の状態を確認し対応する。

### 検出

```bash
gh pr view <parent-pr-number> --json state --jq '.state'
# "MERGED" ならマージ済み
```

### 対応手順

#### 子 worktree がまだ作成されていない場合

ベースを `origin/main` に変更して worktree を作成する:

```bash
git fetch origin main
git worktree add ../<worktree-dir> -b <branch-name> origin/main
```

#### 子 worktree が既に存在する場合（ベースが旧親ブランチ）

```bash
cd ../<child-worktree-dir>
git fetch origin main
git rebase origin/main
# コンフリクトがあれば解消する
```

#### 子 PR が既に作成済みの場合

PR のベースブランチを `main` に変更する:

```bash
gh pr edit <child-pr-number> --base main
```

コンフリクトがある場合は worktree 内でリベースしてプッシュする:

```bash
cd ../<child-worktree-dir>
git fetch origin main
git rebase origin/main
# コンフリクト解消後
git push --force-with-lease
```

### 注意事項

- マージ済みの親ブランチはリモートから削除されている可能性がある。`git fetch --prune` でローカル参照を整理する
- 複数の子 PR がある場合、すべてのベースを更新する
- チェーン依存（A → B → C）で A がマージされた場合、B のベースのみ更新すれば十分。C は B に依存しているため影響を受けない

---

## マージ後のクリーンアップ

PR がマージされた worktree は以下の手順で削除する:

### 個別削除

```bash
git worktree remove ../<worktree-dir>
git branch -d <branch-name>
```

### マージ済み worktree の一括確認

```bash
# 全 worktree を一覧
git worktree list

# マージ済みブランチの確認
git branch --merged main
```

### 依存チェーンのマージ順序

依存関係のある PR は、依存元（親）から順にマージする:

```
1. feat/10-db-schema → main にマージ
2. feat/12-api-endpoint の PR ベースを main に更新してからマージ
3. feat/15-ui-component の PR ベースを main に更新してからマージ
```

GitHub の "Update branch" ボタンまたは以下のコマンドでベースを更新できる:

```bash
gh pr edit <pr-number> --base main
```

---

## トラブルシューティング

### Worktree が既に存在する場合

```bash
# 既存の worktree を確認
git worktree list

# 同名のディレクトリが残っている場合
git worktree remove ../<worktree-dir> --force
```

### ブランチ名が既に存在する場合

リモートに同名のブランチが残っている場合:

```bash
# リモートブランチの確認
git branch -r | grep <branch-name>

# 既存ブランチを使って worktree を作成
git worktree add ../<worktree-dir> <branch-name>
```

### 依存先のブランチが見つからない場合

依存先の Issue がまだ処理されていない場合は、実行順序の誤りを示す。
トポロジカルソートの結果を再確認する。
