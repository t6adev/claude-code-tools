# プロジェクト名（React / TypeScript）

## よく使うコマンド

```bash
npm run dev        # 開発サーバー起動（Vite / Next.js）
npm run build      # プロダクションビルド
npm test           # テスト実行（Vitest / Jest）
npm run lint       # ESLint
npm run typecheck  # 型チェック（tsc --noEmit）
```

## コーディング規約

- TypeScript strict モードを有効にする
- 関数コンポーネントのみ使う（クラスコンポーネント不使用）
- `React.FC` は使わない（戻り値の型は `JSX.Element` または推論に任せる）
- Props の型は `interface Props` で定義する
- デフォルトエクスポートはページ・ルートコンポーネントのみ。他は名前付きエクスポート

## ディレクトリ構成

```
src/
├── app/              # ルーティング（Next.js App Router）
│   └── page.tsx
├── components/       # 再利用可能なコンポーネント
│   └── ui/           # 汎用 UI コンポーネント
├── hooks/            # カスタムフック
├── lib/              # ユーティリティ・ヘルパー
├── types/            # 型定義
└── styles/           # グローバルスタイル
```

## 状態管理

- サーバー状態: React Query / SWR
- クライアント状態: Zustand / Context API（小規模なら useState で十分）
- `useEffect` の過剰使用を避ける（イベントハンドラで処理できる場合はそちらを使う）

## コンポーネント設計

- 1コンポーネント = 1ファイル
- ロジックとビューを分離する（カスタムフックにロジックを切り出す）
- Props は必要最小限にする（深いネストは Context / コンポジションで解決）

## テスト方針

- Testing Library + Vitest / Jest
- ユーザーの操作を起点にテストを書く（実装の詳細をテストしない）
- `data-testid` より `role` / `label` での要素取得を優先する
- E2E テスト: Playwright（重要なフロー）

## スタイリング

- <!-- Tailwind CSS / CSS Modules / styled-components など使用しているものを記載 -->
- インラインスタイル（`style={}`) は避ける

## 重要な制約

- Node.js バージョン: `.nvmrc` を参照
- 環境変数は `VITE_` / `NEXT_PUBLIC_` プレフィックスが必要（ブラウザ公開）
- 機密情報（APIキー等）を `NEXT_PUBLIC_` で公開しない
