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

パターン選定後、ユーザーに以下を確認する（ユーザーの指示から明確にパターンが決まる場合は確認を省略してよい）:

- 提案したパターン一覧で問題ないか
- version-matrix の場合、試したいバージョンの指定があるか
- 他に試したい環境条件（Node.js バージョン、環境変数など）があるか

## Step 4: 再現環境の一括生成

### ディレクトリ構造

デフォルトの親ディレクトリはカレントディレクトリと同階層（`../<repro-問題名>/`）に作成する。
ユーザーの指定がある場合はそのパスを使用する。

```
repro-<issue-name>/
├── REPORT.md             # 内部レポート（ユーザー向け・随時更新）
├── REPORT-EXTERNAL.md    # 外部レポート（パッケージ作者・コミュニティ向け）
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
3. 各ディレクトリの `README.md` を **テンプレートのまま残さず**、必ず具体的な内容で埋める（英語で記述する）:
   - **Purpose**: このパターンで何を検証するか（例: "Verify whether the error occurs with package-x v2.0.0"）
   - **Steps to Reproduce**: 実行コマンドに加え、前提条件や注意点があれば記載する
   - **Expected Behavior**: 具体的に何が起きるべきか（例: "The function should return a valid object without throwing"）
   - **Actual Behavior**: Step 5 の実行後に、実際の結果（エラーメッセージ等）を記入する

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
- 各パターンの実行後、`README.md` の "Actual Behavior" セクションに実際の結果（エラーメッセージや出力）を記入する。テンプレートのコメントを残さず、具体的な内容で置き換える

## Step 6: 結果の整理とレポート出力

親ディレクトリに **2種類のレポート** を出力する。テンプレートは `references/report-template.md` を参照。

### A. 内部レポート（`REPORT.md`）

ユーザー自身が読むためのレポート。元プロジェクトの文脈（リポジトリ URL、PR、ブランチ名、ファイルパス等）をそのまま含めてよい。

含める内容:

1. **問題の概要**: 何が起きているか、元プロジェクトの情報源（PR URL、コミットハッシュ等）
2. **環境情報**: Node.js バージョン、pnpm バージョン、元プロジェクトの関連パッケージとバージョン
3. **各パターンの詳細**: パターンごとに「目的・構成・再現コードの要点・実行コマンド・実行結果」を記載する
4. **結果一覧表**: 全パターンの結果を一覧化
5. **考察と結論**: 結果から導かれる原因の仮説
6. **推奨アクション**: 次のステップ（ワークアラウンド、修正方針等）
7. **更新履歴**: 日時と変更内容

### B. 外部レポート（`REPORT-EXTERNAL.md`）

パッケージ作者やそのパッケージを使う開発者が読むためのレポート。問題を一般化し、特定プロジェクトの文脈に依存しない形で記述する。Issue 報告や知見共有にそのまま使える品質にする。

内部レポートとの違い:

- プロジェクト固有の情報（リポジトリ URL、社内ブランチ名、ファイルパス等）を **含めない**
- 問題を「特定パッケージのバージョン X.Y.Z で、こういう条件のとき、こういう挙動になる」という **一般化された形** で記述する
- 再現手順は **このレポートだけで再現できる** 自己完結した形にする（各パターンの `package.json` と再現コードの全文を含める）
- 期待される挙動と実際の挙動を明確に対比する
- 影響範囲の考察（どのようなユースケースで問題になるか）を含める

含める内容:

1. **タイトル**: 問題を端的に表す（例: "`package-x` v3.0.0 で ESM 環境から `functionY` を呼ぶとエラーになる"）
2. **概要**: 問題の一般的な説明（1-3 文）
3. **再現環境**: Node.js バージョン、OS、パッケージバージョン
4. **再現手順**: `package.json` と再現コードの全文を含む、コピー&ペーストで再現可能な手順
5. **期待される挙動 vs 実際の挙動**: 明確な対比
6. **調査結果**: どのバージョン・条件で発生するか、しないかの一覧表
7. **既知の Issue・関連情報**: 関連パッケージの GitHub Issue を検索した結果（後述）
8. **考察**: 原因の推定と影響範囲
9. **ワークアラウンド**: 現時点で取れる回避策（あれば）

### 既知の Issue の調査

外部レポート作成時に、関連パッケージの GitHub リポジトリで既存の Issue を検索する。

調査手順:

1. `gh search issues "<エラーメッセージやキーワード>" --repo <package-owner>/<package-repo>` で検索する
2. 関連パッケージが複数ある場合は、それぞれのリポジトリで検索する
3. closed な Issue も含めて検索する（`--state all`）
4. 見つかった Issue は以下の観点で整理する:
   - 同一の問題か、類似の問題か
   - open / closed の状態
   - 回避策やパッチが提示されているか
   - 問題が認知されているか（メンテナの反応があるか）

外部レポートの「既知の Issue・関連情報」セクションに結果を記載する:

- 同一・類似の Issue が見つかった場合: Issue URL、ステータス、要約を記載する
- 見つからなかった場合: 「<パッケージ名> のリポジトリで関連する Issue は見つからなかった」と明記する（新規報告の根拠になる）

### レポートの更新ルール

両レポートは作業の進行に合わせて常に最新の状態を保つ:

- Step 7（派生）や Step 8（横展開）で新しいパターンを追加した場合、両レポートに追記する
- ユーザーの追加指示により再実行や条件変更を行った場合、該当パターンの結果を更新する
- 結論が変わった場合は「考察と結論」セクションを書き換える
- 内部レポートは更新時に「更新履歴」セクションに日時と変更内容を追記する

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

## Step 9: 再現リポジトリの公開

調査が完了したら、再現環境を GitHub リポジトリとして公開する。外部レポートや Issue 報告から参照できるようにする。

### モノレポ vs シングルリポの判断

デフォルトでは **1つのリポジトリに全パターンを含める**（モノレポ構成）。
ただし、以下のケースではモノレポが再現のハードルになるため、ユーザーに提示してシングルリポ（パターンごとに別リポジトリ）への切り替えを検討する:

- パターン間で Node.js バージョンが異なり、`.node-version` や `engines` が競合する場合
- パターン間で `pnpm-workspace.yaml` の有無が結論に影響する場合（workspace 環境でのみ再現するバグ等）
- 特定パターンの依存が他パターンの `pnpm install` に干渉する場合（ホイスティングの問題等）

これらに該当しない限り、モノレポで進める。

### リポジトリの準備

1. 不要なパターン（中間的な試行、結論に寄与しないもの）を除外し、最終的に意味のあるパターンのみ残す
2. ルートに `.gitignore` を作成する:
   ```
   node_modules/
   ```
3. 外部レポート（`REPORT-EXTERNAL.md`）の内容をベースにリポジトリの `README.md` を作成する。再現手順は各パターンディレクトリへの相対リンクで参照する
4. 各パターンの `README.md` が「目的・再現手順・期待と実際の挙動」を含んでいることを確認する

### リポジトリの作成

`gh` コマンドでリポジトリを作成し push する:

```bash
cd <parent-dir>
git init
git add .
git commit -m "Minimal reproduction for <問題の概要>"
gh repo create <repo-name> --public --source=. --push
```

リポジトリ名は `repro-<パッケージ名>-<問題の要約>` のような命名にする（例: `repro-vite-esm-build-error`）。
公開範囲（`--public` / `--private`）はユーザーに確認する。

### レポートへの反映

リポジトリ作成後、両レポートにリポジトリ URL を追記する:

- **内部レポート**: 問題の概要セクションにリポジトリ URL を追加
- **外部レポート**: 再現手順セクションにリポジトリ URL を追加し、各パターンディレクトリへのパーマリンクも記載する

## 注意事項

- **元プロジェクトを変更しない**: 再現環境は必ず別ディレクトリに作成する
- **秘密情報を含めない**: `.env` や認証情報は再現環境にコピーしない
- **pnpm workspace に注意**: 親ディレクトリに `pnpm-workspace.yaml` がある場合、workspace 外に配置するか `pnpm-workspace.yaml` を空で置く
- **再現環境内のファイルは英語で記述する**: 各パターンディレクトリ内の `README.md`、コード内のコメント、コミットメッセージ、リポジトリの `README.md` はすべて英語で書く。再現リポジトリは公開を前提とし、パッケージ作者や国際的なコミュニティが読めるようにする。内部レポート（`REPORT.md`）は日本語でよい。外部レポート（`REPORT-EXTERNAL.md`）は、国際的なパッケージメンテナ向けに公開する場合は英語で書く。ユーザーに確認し、日本語コミュニティ向けであれば日本語でもよい

## 追加リソース

### リファレンスファイル

- **`references/patterns.md`** — 切り分けパターンの詳細と判断フローチャート
- **`references/report-template.md`** — REPORT.md のテンプレートと記述ガイド

### スクリプト

- **`scripts/init-repro.sh`** — パターンディレクトリの一括生成・派生・コピー
- **`scripts/sync-repro.sh`** — あるパターンの変更を他のパターンに横展開
