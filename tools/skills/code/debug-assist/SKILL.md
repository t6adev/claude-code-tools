---
name: debug-assist
description: This skill should be used when the user asks to "このエラーを直して", "help me debug this", "fix this stack trace", "なぜこのエラーが出るの", "CI が落ちた", or pastes an error message or stack trace and wants help diagnosing it. Classifies the error type, identifies related files, and proposes up to three root-cause hypotheses with concrete fix plans.
allowed-tools: Bash, Read, Grep, Glob
argument-hint: "[error-message | (no args = paste error in conversation)]"
---

エラーメッセージ・スタックトレースを受け取り、原因仮説と修正方針を提示するスキル。

## Step 1: エラーの受け取り

`$ARGUMENTS` にエラーメッセージが含まれる場合はそれを使用する。
含まれない場合は「エラーメッセージまたはスタックトレースを貼り付けてください」とユーザーに促す。

## Step 2: エラーの種別判定

エラーを以下のいずれかに分類する:

| 種別                 | 特徴                                       |
| -------------------- | ------------------------------------------ |
| **ランタイムエラー** | 実行時例外、uncaught error、process exit   |
| **型エラー**         | TypeScript の TS2xxx 系エラー              |
| **lint エラー**      | ESLint / oxlint のルール違反               |
| **テスト失敗**       | assertion failed、expect / received の差異 |
| **環境エラー**       | モジュール not found、接続失敗、権限エラー |
| **ビルドエラー**     | バンドラー・コンパイラのエラー             |

## Step 3: 関連ファイルの特定

スタックトレースや import パスからファイルパスを抽出し、以下を実行する:

1. 該当ファイルを Read で読み込み、エラー箇所の前後を把握する
2. エラーに含まれるシンボル名を Grep で検索し、定義元・参照元を確認する
3. 型エラーの場合は型定義ファイル（`.d.ts` / `types/` 以下）も確認する

## Step 4: 原因仮説の提示

原因の仮説を **3つ以内** に絞って提示する。各仮説には以下を含める:

```
### 仮説 1: <タイトル>
**確率**: 高 / 中 / 低
**根拠**: なぜそう考えるか
**確認コマンド**: 仮説を検証するコマンドまたは確認箇所
**修正方針**: 仮説が正しい場合の直し方
```

仮説が1つに絞り込めた場合は直接修正を提案してもよい。

## Step 5: ユーザーの確認結果を受けて修正を支援

ユーザーが確認コマンドの結果を返した場合:

- 仮説が確認できた → 修正を実施するか確認して実行
- 仮説が外れた → 次の仮説を検討し、追加情報を Grep・Read で収集する

修正後は該当の検証コマンドを実行してエラーが解消されたことを確認する。

## 注意事項

- **過剰修正しない**: エラーに直接関係しない箇所には触れない
- **環境エラーは実装で解決しない**: 環境起因（パス設定・権限・OS依存）は修正方針を提示するにとどめ、ユーザーに対応を委ねる
- **既存の失敗と区別する**: 実装前から存在したエラーは「既存の問題」として分離して報告する
