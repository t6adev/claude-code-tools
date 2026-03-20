# ドキュメントテンプレート

## CLAUDE.md

```markdown
# [プロジェクト名]

## 概要

[プロジェクトの目的・ゴール（2〜3文）]

## 技術スタック

- Frontend: [例: Next.js 15 (App Router)]
- Backend: [例: Next.js API Routes / Hono]
- Database: [例: PostgreSQL]
- ORM: [例: Prisma]
- 認証: [例: NextAuth.js v5]
- インフラ: [例: Vercel]
- CSS: [例: Tailwind CSS]

## 開発規約

- パッケージマネージャー: pnpm
- コードスタイル: [例: oxlint + oxfmt]
- テスト: [例: Vitest (unit) + Playwright (E2E)]
- コミット規約: Conventional Commits

## よく使うコマンド

- 開発サーバー起動: `pnpm dev`
- テスト実行: `pnpm test`
- リント・型チェック: `pnpm check`
- ビルド: `pnpm build`
- DBマイグレーション: `pnpm db:migrate`

## ディレクトリ構成

[プロジェクト確定後に記入]
```

---

## docs/architecture.md

```markdown
# アーキテクチャ概要

## システム構成図

[テキストベースの構成図]

例:
Browser → Next.js (Vercel) → PostgreSQL (Supabase)
↓
External APIs

## 主要コンポーネント

| コンポーネント | 役割   |
| -------------- | ------ |
| [名前]         | [説明] |

## データモデル概要

### [エンティティ名]

| フィールド | 型   | 説明           |
| ---------- | ---- | -------------- |
| id         | UUID | プライマリキー |
| ...        | ...  | ...            |

## 認証・認可フロー

[認証フローの説明]

## API設計方針

- 方式: [REST / GraphQL / tRPC]
- エンドポイント規約: [例: RESTful、/api/v1/...]
- エラーレスポンス形式: [例: { error: string, code: string }]

## 未決事項

- [ ] [調査が必要な設計項目]
```

---

## docs/requirements.md

```markdown
# 要件定義

## スコープロック

- ロック日: YYYY-MM-DD
- 変更履歴:
  - YYYY-MM-DD: [変更内容と理由]

スコープロック後に Must を変更する場合は変更履歴に記録する。

## ターゲットユーザー

[主なユーザー像の説明]

## 機能要件（MoSCoW）

### Must（ファーストリリース必須）

- [ ] [機能名]: [説明]

### Should（できれば含めたい）

- [ ] [機能名]: [説明]

### Could（余裕があれば）

- [ ] [機能名]: [説明]

### Won't（今回スコープ外）

- [機能名]: [理由]

## 非機能要件

- パフォーマンス: [例: LCP 2.5秒以内]
- セキュリティ: [例: OWASP Top 10 対応]
- アクセシビリティ: [例: WCAG 2.1 AA]

## スコープ外

[明示的に対象外とすること]
```
