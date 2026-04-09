---
name: task-breakdown
description: This skill should be used when the user asks to "既存プロジェクトのタスクを整理して", "技術的負債をIssue化して", "このコードベースを改善するタスクを洗い出して", "GitHub Projectに健全化タスクを登録して", "break down what needs to be fixed in this project", "surface tech debt as issues", or "create a project board for cleanup work". Diagnoses pain points and codebase health of an existing project, then registers improvement tasks as GitHub Issues and a Project Board.
allowed-tools: Bash, Read, Write, Glob, Grep, TodoWrite
argument-hint: "[project-number (既存のGitHub Projectに追加する場合)]"
---

既存プロジェクトのペインポイントとコードベースの健全性を診断し、GitHub IssuesとProject Boardに改善タスクとして登録するスキル。

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール済みであること（未設定の場合は dry-run モードで代替）

---

## スタート時: 既存状態の確認

### ドキュメントの確認

以下のファイルが存在するか確認する:

- `CLAUDE.md` — 技術スタック・開発規約
- `docs/architecture.md` — アーキテクチャ概要

両ファイルが存在しない場合:

```
プロジェクトドキュメント（CLAUDE.md / docs/architecture.md）が見つかりませんでした。

選択してください:
1. `/analyze-project` を先に実行してドキュメントを整備してから戻る（推奨）
2. このまま続行する（コードベースを直接スキャンして補完します）
```

### GitHub CLIの確認

```bash
gh auth status
```

認証エラーの場合:

```
GitHub CLI が未認証です。
`gh auth login` で認証後に再実行してください。

または dry-run モードで続行することもできます。
dry-run モードでは GitHub への登録を行わず、docs/task-backlog.md にタスク一覧を出力します。
続行しますか？ [dry-run で続行 / キャンセル]
```

### 既存 Issue・Project の確認

```bash
gh issue list --limit 10
gh project list --owner "@me" --limit 10
```

結果をユーザーに提示し、既存の状況を把握する。

---

## Phase 1: ペインポイント・ヒアリング

プロジェクトで「今、何が痛いか」を引き出すインタビュー。各ステップを順番に確認する。

### Step 1: プロジェクトの現状認識

以下を質問する:

```
1. このコードベースは最後にいつ頃から活発に開発されていますか？
2. 現在何人がこのプロジェクトに関わっていますか？
3. 新しいエンジニアがこのプロジェクトで作業を始めるときの最大の障壁は何ですか？
```

### Step 2: ペインポイントの洗い出し（5カテゴリ）

各カテゴリについて順番に質問する:

| カテゴリ       | 質問                                                             |
| -------------- | ---------------------------------------------------------------- |
| ドキュメント   | どのAPIや機能が一番ドキュメント不足ですか？                      |
| テスト         | テストがない、または壊れているエリアはどこですか？               |
| 技術的負債     | 触るのが怖い、または避けているコードやモジュールはありますか？   |
| 運用・インフラ | CIが不安定、またはデプロイに問題がある箇所はありますか？         |
| オーナーシップ | 誰もレビューできない、または担当者不明なコード領域はありますか？ |

回答内容を TodoWrite に蓄積しておく。

### Step 3: 優先度の確認

洗い出したペインポイントを提示し、優先度を確認する:

```
収集したペインポイント:
[洗い出した内容を箇条書きで列挙]

これらの優先度を教えてください:
- ブロッカー（新機能開発前に必ず解消が必要）なものはどれですか？
- まず着手したいものはどれですか？
```

### Step 4: スコープ合意

```
今回のタスク整理のスコープを決めましょう:
1. ワンスプリントのクリーンアップ（3〜5件の絞り込んだタスク）
2. 中長期の健全化ロードマップ（カテゴリ別に網羅的にタスク化）

どちらを希望しますか？
```

---

## Phase 2: コードベース診断スキャン

ヒアリングの結果を踏まえ、コードから客観的な証拠を収集する。**読んだ情報は TodoWrite に蓄積し、Phase 3 のタスク作成で参照する。**

診断する観点:

- **テストの空白エリア** — ソースディレクトリに対応するテストファイルがないディレクトリ
- **壊れたCI** — `.github/workflows/` と `gh run list --limit 5` で直近の状態を確認
- **未解決の TODO/FIXME** — ソース全体を Grep で検索
- **大きすぎるファイル** — 400行以上のソースファイル
- **エラーハンドリングの欠落** — 空の catch ブロックや unhandled promise パターン
- **ハードコードされた秘密情報** — `password\s*=`, `api_key\s*=` などを Grep

具体的なコマンドと優先度判断の目安は `references/diagnostic-scan.md` を参照する。

スキャン結果をユーザーに提示し、タスク化する項目を確認する。

---

## Phase 3: タスク分解・カテゴリ化

### タスク粒度の原則

**1タスク = 1PRで完結できる粒度**を守る。

「テストを全部書く」ではなく「`src/payments/` モジュールのユニットテストを追加する」のように具体的に分割する。

### タスクカテゴリ（既存プロジェクト向け）

1. **ドキュメント補完** (`docs:`)
   - 未ドキュメントの公開API・エンドポイント
   - README・CONTRIBUTINGの整備
   - アーキテクチャ決定記録（ADR）の追記

2. **テスト追加** (`test:`)
   - テストカバレッジが低いモジュール
   - クリティカルパスのE2E・統合テスト

3. **技術的負債解消** (`refactor:`)
   - 大きすぎるファイルの分割
   - 重複ロジックの共通化
   - 古くなったパターンの更新

4. **CI/CD修復** (`chore:`)
   - 壊れているワークフローの修正
   - 欠けているチェック（型チェック・lint）の追加

5. **セキュリティ修正** (`fix:`)
   - ハードコードされた秘密情報の環境変数化
   - バリデーション・認証チェックの欠落

6. **調査・決定** (調査)
   - オーナーシップ不明な領域の担当整理
   - 先送りされた技術選定の決定

7. **オーナーシップ明確化**
   - 誰も触れていないモジュールの整理・廃止検討

Issue の body は以下の構成を基本とする（詳細テンプレートが必要な場合のみ `references/issue-templates.md` の該当セクションを参照）:

- ## 概要 / ## 作業内容 / ## 完了条件

### ユーザーとのタスクリスト確認

タスク案を提示してユーザーの確認を取る:

```
以下のタスクを作成します:

[カテゴリ別にタスクリストを提示]

追加・削除・変更はありますか？
確認後、GitHub Issueを作成してProject Boardに登録します。
```

---

## Phase 4: GitHub Project登録

### Project の特定または作成

`$ARGUMENTS` にproject番号が指定されている場合はそれを使用する。

指定がない場合:

```bash
gh project list --owner "@me" --limit 10
```

既存Projectがある場合はユーザーに選択を求める。ない場合またはユーザーが新規作成を希望する場合:

```bash
gh project create --owner "@me" --title "[リポジトリ名] 健全化ロードマップ"
gh project list --owner "@me"
```

### ラベルの準備

以下のラベルが存在しない場合は作成する:

```bash
gh label create "docs" --color "0075ca" --description "ドキュメント補完"
gh label create "test" --color "e4e669" --description "テスト追加"
gh label create "refactor" --color "d93f0b" --description "技術的負債解消"
gh label create "security" --color "ee0701" --description "セキュリティ修正"
gh label create "ci-cd" --color "bfd4f2" --description "CI/CD修復"
gh label create "research" --color "c5def5" --description "調査・決定"
```

### Issue 作成・Project登録

```bash
# body は Phase 3 で定めた基本構成（概要 / 作業内容 / 完了条件）を使用する
ISSUE_URL=$(gh issue create \
  --title "docs: [対象のAPI・機能名] のリクエスト/レスポンス仕様を追記する" \
  --label "docs" \
  --body "$(cat <<'EOF'
## 概要
[ペインポイント・診断結果から導出した背景]

## 作業内容
- [具体的な作業項目]

## 完了条件
- [ ] [検証可能な条件]
EOF
)")

gh project item-add [PROJECT_NUMBER] --owner "@me" --url "$ISSUE_URL"
```

GitHub Project のカラムはデフォルト（Todo / In Progress / Done）をそのまま使用する。新規Issueは Todo に登録される。

---

## Phase 5: レビューと次のアクション

### サマリーの提示

作成したIssueをカテゴリ別にまとめて提示する:

```
タスク登録が完了しました。

| カテゴリ | Issue数 | 主なタスク |
| --- | --- | --- |
| ドキュメント補完 | X | [代表的なタイトル] |
| テスト追加 | X | [代表的なタイトル] |
| ...  |   |   |

GitHub Project: [URL]
```

### 次のアクションの提案

```
次のステップ:
- 最も優先度の高いIssueから `/implement-task #N` で着手できます
- ドキュメントタスクは `/doc-sync` を使って実装変更と同期しながら進めることもできます
- オンボーディング目的であれば `/analyze-project onboarding` でドキュメントの整備もできます
```

---

## 完了チェックリスト

- [ ] ペインポイント・ヒアリングを完了した
- [ ] コードベース診断スキャンを実施した
- [ ] タスクリストをユーザーと合意した
- [ ] GitHub Project を特定または作成した
- [ ] すべてのIssueを作成してProjectに登録した
- [ ] 次のアクションを提案した

---

## Additional Resources

### Reference Files

- **`references/issue-templates.md`** — ドキュメント補完・テスト追加・技術的負債解消・セキュリティ修正・CI/CD・調査タスクのIssueテンプレート
- **`references/diagnostic-scan.md`** — Phase 2 で使用する診断コマンド・Grep パターン・優先度判断の目安

### Related Skills

- `/analyze-project` — CLAUDE.md と docs/architecture.md を生成するプロジェクト解析スキル（タスク分解の前段として推奨）
- `/implement-task` — 登録したIssueを1件ずつ実装するスキル
- `/doc-sync` — 実装変更とドキュメントを同期するスキル
