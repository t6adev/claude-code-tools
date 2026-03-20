---
name: impact-analysis
description: This skill should be used when the user asks to "このファイルを変えたら何が壊れる？", "what depends on this function", "影響範囲を調べて", "show me what imports this module", or wants to understand the blast radius before modifying a shared utility, exported type, or public API. Traces import/require references up to two levels deep and lists affected test files.
allowed-tools: Grep, Glob, Read
argument-hint: "[file-path | symbol-name]"
---

変更対象のファイルまたはシンボルを起点に、影響を受けるファイルとテストを列挙するスキル。

## Step 1: 対象の受け取り

`$ARGUMENTS` を以下のいずれかとして解釈する:

- **ファイルパス**: `src/utils/auth.ts` のようなパス
- **シンボル名**: 関数名・クラス名・型名（例: `createSession`、`UserType`）

引数がない場合は「分析対象のファイルパスまたはシンボル名を指定してください」とユーザーに促す。

## Step 2: 直接の依存元を探索

### ファイルパスの場合

以下のパターンで Grep 検索する:

```
import.*from.*<filename>
require.*<filename>
export.*from.*<filename>
```

### シンボル名の場合

以下のパターンで Grep 検索する:

```
import.*\b<symbol>\b
<symbol>\(
: <symbol>
extends <symbol>
implements <symbol>
```

## Step 3: 間接依存の探索

Step 2 で見つかったファイルを起点に、さらにそれらを import しているファイルを探索する。
探索は **最大2段階** まで行い、それ以上の深さはスコープ外として明示する。

## Step 4: テストファイルの特定

影響ファイル一覧に対して、以下のパターンでテストファイルを特定する:

- `<filename>.test.ts` / `<filename>.spec.ts`
- `__tests__/<filename>.ts`
- テストファイル内で対象シンボルを参照しているもの（Grep）

## Step 5: 結果の報告

以下の形式で結果を出力する:

```
## 影響範囲分析: <対象>

### 直接依存（1段階目）
- src/services/userService.ts — `createSession` を呼び出し
- src/api/authRoute.ts — `createSession` を import

### 間接依存（2段階目）
- src/middleware/auth.ts — authRoute.ts を経由

### 影響を受けるテスト
- src/services/__tests__/userService.test.ts
- src/api/__tests__/authRoute.test.ts

### 注意が必要な箇所
- <変更時に特に気をつけるべき点があれば記載>
```

影響がゼロの場合は「このファイル/シンボルを参照しているコードは見つかりませんでした」と報告する。

## 注意事項

- **ダイナミックインポートは検出できない**: `await import(variable)` のような動的参照は静的解析では追跡できないため、その旨を注記する
- **外部パッケージは対象外**: `node_modules` 以下はスキップする
- **変更は行わない**: このスキルはあくまで調査のみ。修正は `implement-task` や直接編集で行う
