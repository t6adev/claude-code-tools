# node-project-setup

Node.js プロジェクトを現代のベストプラクティスで設定するスキル。
pnpm・TypeScript・並列 check スクリプトパターンを標準構成として適用します。

## 使い方

```
/node-project-setup [project-directory or .]
```

## 設定される内容

- **pnpm** をパッケージマネージャーとして選択（`packageManager` フィールドで最新版固定）
- **`engines`** フィールドで Node.js / pnpm の最新バージョン制約を明示
- **`"type": "module"`** で ESM をデフォルトに
- **TypeScript** (`typescript` + `@types/node`) を devDependency として追加
- **`tsconfig.json`** を strict + NodeNext (ESM対応) で生成
- **oxlint / oxfmt** を lint・format ツールとして採用
- **並列 check パターン** を scripts に設定:
  ```json
  "check": "pnpm run --parallel \"/^check:.*/\"",
  "check:types": "tsc --noEmit",
  "check:lint": "oxlint",
  "check:fmt": "oxfmt --check"
  ```
- **`.npmrc`** で pnpm のデフォルト挙動を明示

## インストール

```bash
ln -s "$REPO/tools/skills/code/node-project-setup" ~/.claude/skills/node-project-setup
```
