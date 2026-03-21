---
name: analyze-project
description: This skill should be used when the user asks to "プロジェクトを解析して", "コードベースを調べてドキュメント化して", "移行作業の準備をして", "新機能実装の前にプロジェクトを整理して", "analyze this codebase", "document the project structure", "既存プロジェクトのCLAUDE.mdを作って", or wants to prepare CLAUDE.md and architecture docs before a migration, feature development, or onboarding.
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, TodoWrite
argument-hint: "[goal: migration|feature|onboarding|refresh]"
---

既存プロジェクトのコードを読み解き、コーディングエージェントがすぐに実装タスクを実行できるコンテキストドキュメントを生成・更新するスキル。

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること

---

## スタート時: 目的とモードの確認

`$ARGUMENTS` の内容によって動作モードを決定する:

| 引数         | モード           | 生成物                                               |
| ------------ | ---------------- | ---------------------------------------------------- |
| `migration`  | 移行準備         | CLAUDE.md・architecture.md・**migration-plan.md**    |
| `feature`    | 機能追加準備     | CLAUDE.md・architecture.md（拡張ポイントを強調）     |
| `onboarding` | オンボード       | CLAUDE.md・architecture.md（読み解き重視）           |
| `refresh`    | ドキュメント更新 | 既存 CLAUDE.md・architecture.md を現状に合わせて更新 |
| （省略）     | 自動判断         | ユーザーに目的を確認してから最適なモードを選ぶ       |

引数がない場合は以下を質問する:

```
このプロジェクト解析の目的を教えてください:
1. 移行作業の準備（フレームワーク・インフラ移行など）
2. 新機能実装の準備
3. 新規メンバーへのオンボーディング
4. 既存ドキュメントの更新・刷新

番号か概要を入力してください:
```

---

## Phase 1: 現状確認

### 既存ドキュメントの確認

以下のファイルが存在する場合は内容を読み、どこまで情報があるかを把握する:

- `CLAUDE.md`
- `docs/architecture.md`
- `docs/requirements.md`
- `docs/CONTRIBUTING.md`
- `README.md`

既存ドキュメントがある場合:

- `refresh` モード以外では「既存ドキュメントが見つかりました。補完・更新しますか？それとも現状コードから再生成しますか？」と確認する
- `refresh` モードでは補完・更新を前提に進める

### プロジェクト規模の概把握

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.py" -o -name "*.go" -o -name "*.rs" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" | wc -l
```

規模に応じて探索戦略を変える（小: ~50 / 中: 50~300 / 大: 300+）。
大規模の場合はサブエージェントへの委譲を検討する。
（`/subagent-strategy` が利用可能な場合は、探索の委譲戦略を参照するとよい）

---

## Phase 2: コードベース探索

以下の順で体系的に解析する。**読んだ情報は TodoWrite に蓄積し、Phase 3 の執筆で参照する。**

### Step 1: プロジェクト構成の把握

ルート直下のファイル・ディレクトリを確認し、以下を特定する:

- 言語・ランタイム（`package.json`, `pyproject.toml`, `go.mod`, `Cargo.toml` 等）
- パッケージマネージャー
- monorepo か否か（`workspaces`, `packages/`, `apps/` ディレクトリ等）

### Step 2: 技術スタックの特定

設定ファイル・依存関係から読み取る観点:

- **フレームワーク**: React / Next.js / Hono / FastAPI / Gin など
- **データベース・ORM**: Prisma / Drizzle / SQLAlchemy / GORM など
- **認証**: NextAuth / Lucia / Passport / JWT など
- **テストフレームワーク**: Vitest / Jest / pytest / go test など
- **CI**: `.github/workflows/` の内容
- **インフラ**: `Dockerfile` / `fly.toml` / `vercel.json` 等
- **コードスタイル**: ESLint / Biome / oxlint / Prettier 等の設定ファイル

### Step 3: ディレクトリ構造・アーキテクチャの把握

主要ディレクトリの構成から以下を把握する:

- コンポーネント・モジュールの分割方針（機能別 / レイヤー別 / ルート別）
- エントリーポイント（`main.ts`, `index.ts`, `app.ts`, `server.ts` など）
- 設定ファイルの場所（環境変数・シークレット管理）

### Step 4: データモデルの把握

以下から主要エンティティを特定する:

- Prisma: `prisma/schema.prisma`
- Drizzle: `src/db/schema.ts` など
- SQL マイグレーション: `migrations/` または `supabase/migrations/`
- TypeScript 型定義: `types/`, `src/types/`
- Python: `models.py`, `src/models/`
- Go: `models/` または各パッケージの型定義

### Step 5: 主要機能の把握

ルート定義・コントローラーからアプリケーションの機能を読み取る:

```bash
# Next.js App Router の場合
# Glob pattern="app/**/page.tsx" / "app/**/route.ts"

# Express / Hono 等の場合
# Grep pattern="(router\.|app\.)(get|post|put|delete|patch)" glob="**/*.ts"
```

### Step 6: 開発コマンドの確認

`package.json` の `scripts`、`Makefile`、`justfile`、`README.md` から以下を抽出する:

- dev サーバー起動 / テスト実行 / ビルド / lint・型チェック / DB マイグレーション

### Step 7: モード別の追加探索

**migration モードの場合**:

- 現フレームワーク・ライブラリのバージョンを確認する
- deprecated API の使用箇所を Grep で特定する
- テストファイルの数・種類を確認する
- 外部依存（サードパーティ連携・環境変数）を一覧化する

**feature モードの場合**:

- 類似機能の既存実装パターンを把握する
- 状態管理・データフェッチの方針を確認する
- 新しいコンポーネント・モジュールを追加する際の規約を特定する

---

## Phase 3: ドキュメント生成

ドキュメントのテンプレートは `${CLAUDE_SKILL_DIR}/references/doc-templates.md` を参照する。

### 生成するファイル

| ファイル                 | 常時 / 条件付き      |
| ------------------------ | -------------------- |
| `CLAUDE.md`              | 常時生成・更新       |
| `docs/architecture.md`   | 常時生成・更新       |
| `docs/migration-plan.md` | migration モードのみ |

### 出力のルール

- 読み取れなかった項目は `[要確認]` とマークする（空欄にしない）
- 推測した内容には `（コードから推測）` と注記する
- 生成後に未確定箇所をリストアップしてユーザーに提示する

---

## Phase 4: レビューと補完

1. `[要確認]` 箇所をリストアップしてユーザーに確認を求める
2. ユーザーの回答をドキュメントに反映する
3. モードに応じた次のアクションを提案する:

| モード       | 推奨する次のアクション                                    |
| ------------ | --------------------------------------------------------- |
| `migration`  | `/implement-task` で migration-plan.md の各ステップを実行 |
| `feature`    | `/implement-task` でIssue化して実装                       |
| `onboarding` | ドキュメントをチームへ共有                                |
| `refresh`    | `/doc-sync` で今後の変更との同期フローを確立              |

---

## 完了チェックリスト

- [ ] 目的・モードをユーザーと合意した
- [ ] 技術スタックを正確に特定した
- [ ] CLAUDE.md が生成・更新された
- [ ] docs/architecture.md が生成・更新された
- [ ] migration モードの場合、docs/migration-plan.md が生成された
- [ ] `[要確認]` 項目をユーザーに提示した
- [ ] 次のアクションを提案した

---

## Additional Resources

### Reference Files

- **`references/doc-templates.md`** — CLAUDE.md / architecture.md / migration-plan.md のテンプレートと出力ルール
