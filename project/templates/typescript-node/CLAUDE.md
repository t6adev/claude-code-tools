# プロジェクト名（TypeScript / Node.js）

## よく使うコマンド

```bash
npm run dev        # 開発サーバー起動（ts-node / tsx）
npm run build      # TypeScript コンパイル
npm test           # テスト実行（Jest / Vitest）
npm run lint       # ESLint
npm run typecheck  # 型チェックのみ（tsc --noEmit）
```

## コーディング規約

- TypeScript strict モードを有効にする（`"strict": true`）
- `any` は使わない。不明な型は `unknown` を使う
- `interface` より `type` を優先（ただしクラス実装には `interface`）
- 非同期処理は `async/await`（コールバック・Promise チェーンは避ける）
- エラーは `Error` サブクラスで型付けする

## ディレクトリ構成

```
src/
├── index.ts          # エントリーポイント
├── types/            # 型定義
├── utils/            # ユーティリティ関数
└── ...

tests/
├── unit/
└── integration/
```

## インポート規約

- パスエイリアスは `tsconfig.json` の `paths` で定義する
- 外部ライブラリ → 内部モジュールの順でインポートを整理する
- `import type` を型インポートに使う

## テスト方針

- テストフレームワーク: Jest または Vitest
- テストファイル: `*.test.ts` または `*.spec.ts`
- 外部依存（DB・API）はモックする
- テスト名は `should <動詞> when <条件>` の形式で書く

## エラーハンドリング

- 予期されるエラーは明示的に型を持つ（`class NotFoundError extends Error`）
- Promise の未処理リジェクションを作らない
- `try/catch` は最上位レイヤー（HTTP ハンドラ・CLI エントリ）に集約する

## 重要な制約

- Node.js バージョン: `.nvmrc` または `package.json` の `engines` を参照
- 環境変数は `process.env` を直接使わず、`src/config.ts` 経由でアクセスする
