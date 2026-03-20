# debug-assist

エラーメッセージ・スタックトレースを解析し、原因仮説と修正方針を提示するスキル。

## 使い方

```
/debug-assist [error-message]
```

引数にエラーメッセージを渡すか、引数なしで呼び出してから会話内に貼り付けることもできます。

## 例

```
/debug-assist "TypeError: Cannot read properties of undefined (reading 'id')"
```

```
/debug-assist
> TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.
```

## 動作

1. エラーの種別を判定（ランタイム / 型 / lint / テスト失敗 / 環境 / ビルド）
2. スタックトレースから関連ファイルを特定・読み込み
3. 原因仮説を3つ以内に絞り、確認コマンドと修正方針を提示
4. ユーザーの確認結果を受けて修正を実施

## 対応するエラー種別

- TypeScript 型エラー
- ランタイム例外
- ESLint / oxlint エラー
- テスト失敗（Jest / Vitest）
- ビルドエラー（tsc / esbuild / vite）
- モジュール not found 等の環境エラー
