---
name: node-project-setup
description: Configure a Node.js project with pnpm, TypeScript, latest versions, and parallel script patterns following modern best practices
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: "[project-directory or .]"
---

Node.js プロジェクトを現代のベストプラクティスに従ってセットアップ・設定します。
既存プロジェクトへの適用も、新規プロジェクトの初期化も対象とします。

## 1. Package Manager: pnpm を選択

pnpm を基本パッケージマネージャーとして使用します。

**最新版のインストール:**

```bash
# 最新バージョンを確認してからインストール
npm install -g pnpm@latest
# または Corepack を使う場合
corepack enable && corepack prepare pnpm@latest --activate
```

`package.json` に `packageManager` フィールドを設定して pnpm バージョンを固定します:

```json
{
  "packageManager": "pnpm@X.Y.Z"
}
```

バージョンは `pnpm --version` で確認した実際のバージョンを記載します。

## 2. Version Configuration

**Node.js の最新バージョン確認:**

```bash
# 最新の LTS バージョンを確認
node --version            # 現在の環境
# 公式サイト https://nodejs.org で最新 LTS を確認
```

`package.json` の `engines` フィールドで Node.js と pnpm のバージョン制約を明示します:

```json
{
  "engines": {
    "node": ">=X.Y.Z",
    "pnpm": ">=X.Y.Z"
  }
}
```

バージョンには `node --version` / `pnpm --version` で確認した現在の最新版を記載します。

## 3. ESM (ES Modules) をデフォルトに

`package.json` に `"type": "module"` を設定して ESM を標準とします:

```json
{
  "type": "module"
}
```

## 4. TypeScript のセットアップ

TypeScript を開発依存としてインストールします:

```bash
pnpm add -D typescript @types/node
```

`tsconfig.json` を作成します（strict + ESM 対応）:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 5. Lint / Format ツール

Rust 製の高速ツールを採用します:

```bash
pnpm add -D oxlint @oxc-project/oxfmt
```

- **oxlint** — ESLint 互換の高速 linter
- **oxfmt** — Biome 互換の高速 formatter

## 6. Script Organization: parallel check/fix パターン

`pnpm run --parallel "/^check:.*/"` パターンを使って、`check:` プレフィックスを持つスクリプトをすべて並列実行します。
同様に `fix:` プレフィックスで自動修正系タスクをまとめます。

```json
{
  "scripts": {
    "build": "tsc",
    "check": "pnpm run --parallel \"/^check:.*/\"",
    "check:types": "tsc --noEmit",
    "check:lint": "oxlint",
    "check:fmt": "oxfmt --check",
    "fix": "pnpm run --parallel \"/^fix:.*/\"",
    "fix:lint": "oxlint --fix",
    "fix:fmt": "oxfmt"
  }
}
```

**パターンの原則:**

- 並列実行可能なチェック系タスクはすべて `check:` プレフィックスを付ける
- 自動修正系タスクはすべて `fix:` プレフィックスを付ける
- `check` / `fix` スクリプトは常に正規表現 + parallel で実行する（個別スクリプトを直接列挙しない）
- 新しいチェック/修正を追加する際は `check:xxx` / `fix:xxx` として追加するだけで自動的に含まれる

同様のパターンを `test:` など他のカテゴリにも適用できます:

```json
{
  "test": "pnpm run --parallel \"/^test:.*/\""
}
```

## 7. .npmrc 設定

pnpm のデフォルト挙動を守るために `.npmrc` を作成します:

```ini
shamefully-hoist=false
strict-peer-dependencies=false
```

## 8. package.json の完成形

以下を組み合わせた `package.json` の例:

```json
{
  "name": "my-project",
  "version": "0.1.0",
  "type": "module",
  "packageManager": "pnpm@X.Y.Z",
  "engines": {
    "node": ">=X.Y.Z",
    "pnpm": ">=X.Y.Z"
  },
  "scripts": {
    "build": "tsc",
    "check": "pnpm run --parallel \"/^check:.*/\"",
    "check:types": "tsc --noEmit",
    "check:lint": "oxlint",
    "check:fmt": "oxfmt --check",
    "fix": "pnpm run --parallel \"/^fix:.*/\"",
    "fix:lint": "oxlint --fix",
    "fix:fmt": "oxfmt"
  },
  "devDependencies": {
    "@oxc-project/oxfmt": "latest",
    "@types/node": "latest",
    "oxlint": "latest",
    "typescript": "latest"
  }
}
```

## Verification

セットアップ完了後に以下を実行して確認します:

```bash
pnpm install
pnpm check        # 型チェック・lint・フォーマットをすべて並列実行
pnpm fix          # lint・フォーマットの自動修正をすべて並列実行
pnpm build        # TypeScript のビルド確認
```
