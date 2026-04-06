---
name: minimal-repro
description: This skill should be used when the user asks to "最小再現環境を作って", "再現環境を構築して", "問題を切り分けたい", "パッケージの不具合か確認したい", "create a minimal reproduction", "isolate the issue", "build a repro environment", "reproduce this bug", "narrow down the cause", "is this a package bug or my code", "このPRの問題を再現して", "this commit broke something", or wants to determine whether a bug is caused by a package, the environment, or application code. Accepts PR URLs, commit hashes, or branch names as input.
---

パッケージ・環境・アプリコードのどこに原因があるか切り分けるため、最小再現環境を複数パターン一括生成するスキル。

## Step 1: 問題の把握

`$ARGUMENTS` に問題の説明が含まれる場合はそれを使用する。
含まれない場合は以下を確認する:

1. **何が起きているか**: エラーメッセージ、期待と実際の挙動の差異
2. **疑わしい原因**: パッケージ、環境、アプリコード、またはわからない
3. **関連パッケージ**: 問題に関わるパッケージ名とバージョン

### GitHub PR・git commit log からの情報収集

`$ARGUMENTS` に PR URL（`https://github.com/.../pull/123`）や `#123` が含まれる場合、`gh pr view` で PR の説明・変更ファイル一覧を取得する。
コミットハッシュやブランチ名が含まれる場合、`git log` / `git show` で変更内容を取得する。

これらから以下を抽出する:

- 変更されたパッケージとそのバージョン差分（`package.json` の diff）
- 問題に関連するコード変更（再現コードの素材にする）
- PR のコメントや Issue リンクに記載された再現手順やエラー情報

## Step 2: 現在の環境を分析

問題が起きたプロジェクトから以下を収集する:

1. `package.json` を読み、関連パッケージとバージョンを特定する
2. `tsconfig.json` があれば TypeScript 設定を確認する
3. Node.js バージョン（`node -v`）を記録する
4. パッケージマネージャは pnpm を前提とする
5. 問題に関連するコードを特定し、最小限に絞り込む

## Step 3: 切り分けパターンの設計

以下の基本パターンから、問題に適したものを選択する。詳細は `references/patterns.md` を参照。

| パターン           | 目的                      | いつ使うか                 |
| ------------------ | ------------------------- | -------------------------- |
| **baseline**       | 現環境の最小再現          | 常に作成（必須）           |
| **version-matrix** | パッケージバージョン違い  | パッケージ起因を疑う場合   |
| **isolation**      | 特定パッケージを除外/置換 | 依存の組み合わせを疑う場合 |
| **code-variant**   | コードの書き方を変える    | アプリコード起因を疑う場合 |

パターン選定後、ユーザーに以下を確認する:

- 提案したパターン一覧で問題ないか
- version-matrix の場合、試したいバージョンの指定があるか
- 他に試したい環境条件（Node.js バージョン、環境変数など）があるか

## Step 4: 再現環境の一括生成

### ディレクトリ構造

デフォルトの親ディレクトリはカレントディレクトリと同階層（`../<repro-問題名>/`）に作成する。
ユーザーの指定がある場合はそのパスを使用する。

```
repro-<issue-name>/
├── REPORT.md             # 調査レポート（自動生成・随時更新）
├── baseline/             # 現環境の最小再現
│   ├── package.json
│   ├── tsconfig.json     # (必要な場合)
│   ├── repro.ts          # 最小再現コード
│   └── README.md         # 再現手順
├── pattern-a/            # バージョン違い等
│   ├── package.json
│   ├── repro.ts
│   └── README.md
└── pattern-b/            # 別パターン
    ├── ...
    └── README.md
```

### 生成手順

`scripts/init-repro.sh` を使って雛形を一括生成する:

```bash
bash <skill-dir>/scripts/init-repro.sh <parent-dir> baseline pattern-a pattern-b
```

その後、各パターンの内容をカスタマイズする:

1. **baseline**: 現環境と同じパッケージバージョンで、問題を再現する最小コードを配置する
2. **各パターン**: `package.json` のバージョンやコードを目的に合わせて変更する
3. 各ディレクトリの `README.md` に再現手順と「このパターンで何を確認するか」を記載する

### 最小コードの原則

- import は問題に関連するもののみ
- 設定ファイルは必要最小限のフィールドのみ
- フレームワーク全体ではなく、問題の関数・コンポーネントだけを抜き出す
- 型定義が不要なら `.js` で十分

## Step 5: 依存インストールと動作確認

各パターンディレクトリで以下を実行する:

```bash
cd <pattern-dir> && pnpm install && pnpm run repro
```

- baseline で問題が再現することを確認する
- 再現しない場合は、コードの抜き出しが不十分な可能性がある。不足を特定して修正する

## Step 6: 結果の整理とレポート出力

全パターンの実行結果を **親ディレクトリに `REPORT.md`** として出力する。
レポートのテンプレートは `references/report-template.md` を参照。

レポートには以下を含める:

1. **問題の概要**: 何が起きているか、元プロジェクトの情報源（PR URL、コミットハッシュ等）
2. **環境情報**: Node.js バージョン、pnpm バージョン、元プロジェクトの関連パッケージとバージョン
3. **各パターンの詳細**: パターンごとに「目的・構成（パッケージとバージョン）・再現コードの要点・実行コマンド・実行結果（stdout/stderr の抜粋）」を記載する。結論を第三者が検証できる粒度で書く
4. **結果一覧表**: 全パターンの結果を一覧化
5. **考察と結論**: 結果から導かれる原因の仮説
6. **推奨アクション**: Issue 報告、ワークアラウンド、修正など次のステップ

### レポートの更新ルール

レポートは作業の進行に合わせて常に最新の状態を保つ:

- Step 7（派生）や Step 8（横展開）で新しいパターンを追加した場合、レポートにも追記する
- ユーザーの追加指示により再実行や条件変更を行った場合、該当パターンの結果を更新する
- 結論が変わった場合は「考察と結論」セクションを書き換える
- 更新時は「更新履歴」セクションに日時と変更内容を追記する

## Step 7: 既存パターンからの派生

結果を踏まえて追加の切り分けが必要な場合、既存パターンを基に新しいパターンを作成する。

### 派生パターンの作成

`scripts/init-repro.sh` の `--from` オプションで既存パターンをコピーして派生を作る:

```bash
# baseline を基に新パターンを作成（ファイルをコピーし、差分だけ変更する）
bash <skill-dir>/scripts/init-repro.sh <parent-dir> --from baseline new-pattern-name

# 単純コピー（--copy: node_modules もコピーし pnpm install を省略できる）
bash <skill-dir>/scripts/init-repro.sh <parent-dir> --copy baseline exact-copy-name
```

- `--from`: `package.json`, `repro.ts`, `tsconfig.json` 等のソースファイルをコピーする。`node_modules` と `pnpm-lock.yaml` はコピーしない（依存を変更する前提のため）
- `--copy`: ディレクトリを丸ごとコピーする（`node_modules` 含む）。同一構成で別条件（環境変数違い等）を試す場合に使う

派生後、目的に合わせて `package.json` やコードを編集し、Step 5 の手順で動作確認する。

### 派生の典型的な使い方

- baseline で再現を確認後、バージョンを変えたパターンを派生する
- version-matrix の結果から、さらに細かいバージョン範囲を絞り込む
- isolation パターンの結果を受けて、別のパッケージを除外するパターンを追加する

## Step 8: 変更の横展開

あるパターンにテストやファイルを追加した場合、`scripts/sync-repro.sh` で他のパターンにも同じ変更を横展開する。

### 特定ファイルを横展開

```bash
# baseline に追加した test.ts と vitest.config.ts を全パターンに横展開
bash <skill-dir>/scripts/sync-repro.sh <parent-dir> baseline test.ts vitest.config.ts

# 特定のパターンだけに横展開
bash <skill-dir>/scripts/sync-repro.sh <parent-dir> baseline test.ts -- version-a version-b
```

### 新規ファイルを自動検出して横展開

```bash
# baseline にあって他のパターンにないファイルを自動検出して横展開
bash <skill-dir>/scripts/sync-repro.sh <parent-dir> --new baseline
```

### 横展開の注意点

- `package.json` と `pnpm-lock.yaml` はデフォルトで横展開対象外（各パターンで依存が異なるため）。`--force` で上書き可能
- 横展開先に同名ファイルが既に存在し内容が異なる場合は「上書き」と表示する
- 横展開後、依存が変わったパターンでは `pnpm install` を再実行する

## 注意事項

- **元プロジェクトを変更しない**: 再現環境は必ず別ディレクトリに作成する
- **秘密情報を含めない**: `.env` や認証情報は再現環境にコピーしない
- **pnpm workspace に注意**: 親ディレクトリに `pnpm-workspace.yaml` がある場合、workspace 外に配置するか `pnpm-workspace.yaml` を空で置く

## 追加リソース

### リファレンスファイル

- **`references/patterns.md`** — 切り分けパターンの詳細と判断フローチャート
- **`references/report-template.md`** — REPORT.md のテンプレートと記述ガイド

### スクリプト

- **`scripts/init-repro.sh`** — パターンディレクトリの一括生成・派生・コピー
- **`scripts/sync-repro.sh`** — あるパターンの変更を他のパターンに横展開
