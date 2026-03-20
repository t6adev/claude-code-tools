---
name: start-webapp
description: Guide the user through starting a new web application project — elicit requirements (MoSCoW scoping), create architecture and requirements documents, break work into tasks, and register them as a GitHub Project kanban board. Use when the user says "新しいWebアプリを作りたい", "Webアプリの立ち上げを手伝って", "start a new web app project", "プロジェクトの要件を整理したい", or "GitHub Projectにタスクを登録したい".
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
---

新規Webアプリプロジェクトの立ち上げをサポートするウィザード。
ヒアリング → 設計ドキュメント作成 → タスク分解 → GitHub Project登録 の順に進める。

## 前提条件

- 対象リポジトリが作成済みで、カレントディレクトリがそのルートであること
- `gh` CLI がインストール・認証済みであること
- 環境構築（Node.js・DBなどのローカル環境）はユーザーが実施する

---

## スタート時: 進捗の確認

スキル起動直後に、以下の順で既存の作業状態を確認する:

1. `docs/requirements.md`、`docs/architecture.md`、`CLAUDE.md` の存在を確認する
2. 存在する場合はその内容を読み込み、どのPhaseまで完了しているかを判断する
3. ユーザーに現状を提示して「続きから始めますか？それとも最初からやり直しますか？」と確認する

続きから再開する場合は、完了済みのPhase/Stepをスキップして未完のところから始める。
最初からやり直す場合は、既存ドキュメントを上書きすることをあらかじめ伝える。

---

## Phase 1: ヒアリング

各ステップを順番に実施する。**各ステップ終了時に「この内容で進めますか？」と確認を取ってから次へ進む。**

### Step 1: プロジェクト概要・ゴール

以下を質問して記録する:

- このアプリで解決したい課題・ゴールは何か
- ファーストリリースの期限や優先度

### Step 2: ターゲットユーザー・主要機能

以下を質問して記録する:

- 主なユーザー像（個人・企業・開発者向けなど）
- ファーストリリースで必ず提供したい機能

各機能については「誰が・どの権限で・どのデバイスで使うか」まで掘り下げて確認する。
抽象的な回答（例: 「ログイン機能が欲しい」）に対しては詳細を引き出す追加質問をする:

- 対象ユーザーは？（一般ユーザー / 管理者 / 企業テナントなど）
- 認証手段は？（メール/パスワード / SNSログイン / SSO など）
- 認可の概念は？（全員同じ権限 / ロールベース / リソースオーナーベースなど）

あると嬉しいが必須でない機能も聞いておく。

### Step 3: 技術スタック選定

**まず** 既存の制約を確認する:

- 会社・チームの標準スタックや使用禁止技術はあるか
- すでに決まっている技術はあるか

制約がない場合、要件・好みを確認しながら候補を提示して選択してもらう。
各候補のメリット・デメリットを簡潔に説明し、ベストプラクティスを反映した構成を推薦する。
ユーザーが迷っている場合は、要件に照らした推薦理由を明示して決断をサポートする。
判断を先送りしたい項目は「TBD Issue」として記録し、後で決定できるようにする。

選定する観点:

- **フロントエンド**: React / Next.js / Remix / SvelteKit / Nuxt など
- **バックエンド**: Next.js API Routes / Hono / Fastify / NestJS など
- **データベース**: PostgreSQL / MySQL / SQLite / MongoDB など
- **ORM**: Prisma / Drizzle / TypeORM など
- **認証**: NextAuth.js / Lucia / Clerk / Auth0 など
- **インフラ/ホスティング**: Vercel / Fly.io / AWS / GCP など
- **CSSフレームワーク**: Tailwind CSS / CSS Modules など

### Step 4: 設計方針

以下の観点について方針を確認する:

- データモデルの概要（主要エンティティとその関係）
- 認証・認可の方針
- APIの設計方針（REST / GraphQL / tRPC など）
- テスト方針（ユニット / 統合 / E2E のバランス）

未決定事項は「調査: 〇〇を決定する」タスクとしてIssue登録候補に追加する。

### Step 5: ファーストリリーススコープ確定

Step 2で洗い出した機能を MoSCoW法 で整理する:

- **Must**: ファーストリリースに必須
- **Should**: できれば含めたい
- **Could**: 余裕があれば
- **Won't**: 今回のスコープ外

ユーザーと合意した Must のみをファーストリリーススコープとする。
確定時に **スコープロック日**（確定した日付）を `docs/requirements.md` に記録する。
スコープロック後に Must を増やす場合は必ず「スコープ影響の確認」を行う（後述）。

### Step 6: 未決事項の洗い出し

ここまでのヒアリングで「まだ決まっていない」「要調査」の項目をリストアップし、
それぞれ「調査タスク」としてIssue登録候補に追加する。
TBD として先送りした技術スタックもここで Issue 化する。

---

## Phase 2: 設計ドキュメント作成

ヒアリング内容をもとに以下のドキュメントを作成・更新する。

テンプレートは `references/doc-templates.md` を参照。

作成するファイル:

- `CLAUDE.md` — プロジェクト概要・技術スタック・開発規約・よく使うコマンド
- `docs/architecture.md` — 設計方針・主要コンポーネント・データモデル
- `docs/requirements.md` — 要件一覧・MoSCoWスコープ・スコープロック日

**ドキュメント更新のルール**: 設計・要件が変わったら、同じタイミングで関連ドキュメントも更新する。
実装PRでは「関連ドキュメントを更新したか」を確認する。

---

## Phase 3: タスク分解・GitHub Project登録

### GitHub Project 作成

```bash
gh project create --owner "@me" --title "[プロジェクト名] ロードマップ"
gh project list --owner "@me"
```

### タスク粒度の原則

**1タスク = 1PRで完結できる粒度**を守る。

必ず含めるタスクカテゴリ:

1. **環境・基盤セットアップ**
   - `chore: プロジェクト初期セットアップ（リンター・フォーマッター・TypeScript）`
     → このタスクは `/node-project-setup` スキルで実行できる
   - `chore: CI/CDパイプラインの構築（GitHub Actions）`
   - `chore: テスト環境のセットアップ`

2. **認証** — `feat: 認証機能の実装（[選択した認証方式]）`
   → このタスクは `/feature-dev` スキルで実装できる

3. **データベース** — `chore: DBスキーマ設計とマイグレーション初期設定`

4. **Must機能** — 各機能ごとにIssueを作成

5. **調査タスク** — 未決事項・TBDごとにIssueを作成

Issue の body テンプレートは `references/issue-templates.md` を参照。

### Issue 作成・Project登録

```bash
# body には references/issue-templates.md の該当テンプレートを使用する
ISSUE_URL=$(gh issue create \
  --title "chore: プロジェクト初期セットアップ" \
  --body "$(cat <<'EOF'
[references/issue-templates.md の「環境セットアップタスク」テンプレートを貼り付ける]
EOF
)")

gh project item-add [PROJECT_NUMBER] --owner "@me" --url "$ISSUE_URL"
```

GitHub Project のカラムはデフォルト（Todo / In Progress / Done）をそのまま使用する。

---

## Phase 4: 進捗に応じたタスク追加・変更

開発が進むにつれ、以下の状況でタスクを追加・変更する。

### 新規タスクの追加

追加のタイミング:

- Should 機能の実装開始前
- 調査タスクの結果、新たな実装タスクが生まれた時
- スプリントレビュー後

追加前に必ずユーザーに確認する。

### 既存Issueの変更・クローズ

技術スタックや設計方針が変わった場合:

1. 影響を受けるIssueを `gh issue list` で特定する
2. 変更内容とその理由をユーザーに提示して確認する
3. 古いIssueをクローズし、新しい内容のIssueを作成して差し替える
   - クローズ時のコメントに「[新Issue番号] に差し替えました」と記載する
4. `docs/architecture.md` または `docs/requirements.md` を同時に更新する

### スコープ変更の扱い

Should 機能を Must に昇格させる、または新機能を Must に追加する場合は必ず以下を確認する:

- ファーストリリースの期限に影響しないか
- 他の Must 機能の優先度に影響しないか
- 代わりに Must から外せる機能はないか

確認後、`docs/requirements.md` のスコープロック日を更新し、変更理由を記録する。

---

## 完了チェックリスト

- [ ] CLAUDE.md が作成・更新された
- [ ] docs/architecture.md が作成された
- [ ] docs/requirements.md が作成された（スコープロック日を含む）
- [ ] GitHub Project が作成された
- [ ] 全 Must 機能のIssueが作成され、Projectに登録された
- [ ] 環境セットアップ・CI/CDのIssueが登録された
- [ ] 調査タスク・TBD IssueがProjectに登録された
- [ ] ユーザーがカンバンを確認・承認した

---

## Additional Resources

### Reference Files

- **`references/doc-templates.md`** — CLAUDE.md / architecture.md / requirements.md のテンプレート
- **`references/issue-templates.md`** — 機能タスク・調査タスク・TBDのIssue bodyテンプレート
