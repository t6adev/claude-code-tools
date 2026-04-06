# 切り分けパターン詳細ガイド

## 判断フローチャート

```
問題発生
  │
  ├─ エラーメッセージにパッケージ名が含まれる？
  │   ├─ Yes → baseline + version-matrix を作成
  │   └─ No  → baseline + code-variant を作成
  │
  ├─ 複数パッケージの組み合わせで発生？
  │   └─ Yes → baseline + isolation を追加
  │
  └─ 特定の書き方でのみ発生？
      └─ Yes → baseline + code-variant を追加
```

## パターン詳細

### baseline（必須）

現在の環境をそのまま最小構成にしたもの。他のパターンとの比較基準になる。

**作成方針**:

- `package.json`: 問題に関連するパッケージのみ記載。`devDependencies` も最小限にする
- バージョンは元の `package.json` と完全一致させる（`^` や `~` を外して固定）
- `tsconfig.json`: TypeScript を使う場合のみ。`strict` 設定は元と合わせる
- 再現コード: 問題を引き起こす最小限のコード。不要な import やロジックは削除

**package.json の例**:

```json
{
  "name": "repro-baseline",
  "private": true,
  "type": "module",
  "scripts": {
    "repro": "tsx repro.ts"
  },
  "dependencies": {
    "problematic-package": "3.1.0"
  },
  "devDependencies": {
    "tsx": "4.19.4",
    "typescript": "5.7.3"
  }
}
```

**repro.ts の例**:

```typescript
import { problematicFunction } from "problematic-package";

// 問題を再現する最小コード
const result = problematicFunction({ option: "value" });
console.log("Result:", result);
// Expected: ...
// Actual: ...
```

### version-matrix

パッケージのバージョンを変えて、どのバージョンから問題が発生するかを特定する。

**作成方針**:

- baseline をコピーし、`package.json` のバージョンのみ変更する
- コードは baseline と完全に同一にする（差分はバージョンのみ）
- 命名規則: `version-<package>-<version>` (例: `version-vite-5.0.0`)

**バージョン選定の基準**:

1. 現在使用中のバージョン（= baseline）
2. 1つ前のメジャーバージョンの最新
3. 現在のメジャーバージョンの最古（`.0` リリース）
4. 最新バージョン（現在と異なる場合）
5. ユーザーが指定したバージョン

**npm でバージョン一覧を確認する方法**:

```bash
pnpm view <package-name> versions --json
```

### isolation

特定のパッケージを除外・置換して、依存の組み合わせが原因かを特定する。

**作成方針**:

- baseline から疑わしいパッケージを1つずつ除外する
- 除外したパッケージの機能はスタブ（モック）で置き換える
- 命名規則: `no-<package>` (例: `no-plugin-x`)

**スタブの書き方**:

```typescript
// stub.ts - パッケージ X のスタブ
export function functionFromX() {
  return "stubbed value";
}
```

package.json の `imports` フィールドでスタブに差し替える:

```json
{
  "imports": {
    "#package-x": "./stub.ts"
  }
}
```

**代替アプローチ**: パッケージを除外する代わりに、代替パッケージに置き換える方法もある。
例: `styled-components` → `@emotion/styled`, `axios` → `fetch`

### code-variant

コードの書き方を変えて、アプリコード側の問題かを特定する。

**作成方針**:

- baseline と同じパッケージ構成で、コードだけを変える
- 命名規則: `variant-<description>` (例: `variant-async-await`, `variant-commonjs`)

**よくある変更パターン**:

| 変更内容                       | 目的                         |
| ------------------------------ | ---------------------------- |
| async/await → .then() チェーン | 非同期処理の書き方が原因か   |
| ESM → CommonJS                 | モジュール形式が原因か       |
| クラス → 関数                  | クラス特有の問題か           |
| 型アサーション削除             | 型の不一致が隠れていないか   |
| エラーハンドリング追加         | 握りつぶされたエラーがないか |
| シングルトン → 毎回生成        | インスタンス共有が原因か     |

## パターン組み合わせの例

### 例1: ビルドエラーの切り分け

Vite でビルド時にエラーが出る場合:

```
repro-vite-build-error/
├── baseline/           # 現構成の最小再現
├── version-vite-4/     # Vite 4 で試す
├── version-vite-5/     # Vite 5 の最新で試す
├── no-plugin-react/    # React プラグインなしで試す
└── variant-cjs/        # CommonJS 形式で試す
```

### 例2: ランタイムエラーの切り分け

特定のライブラリの関数がエラーを投げる場合:

```
repro-lib-runtime-error/
├── baseline/           # 現構成の最小再現
├── version-lib-2.0/    # ライブラリ v2 で試す
├── version-lib-3.0/    # ライブラリ v3 最新で試す
└── variant-no-strict/  # TypeScript strict: false で試す
```

### 例3: 依存衝突の切り分け

2つのパッケージを組み合わせると動かない場合:

```
repro-dep-conflict/
├── baseline/           # 両方入りの最小再現
├── only-package-a/     # パッケージ A のみ
├── only-package-b/     # パッケージ B のみ
└── version-a-old/      # パッケージ A の旧バージョン
```
