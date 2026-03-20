---
name: doc-sync
description: This skill should be used when the user asks to "ドキュメントを更新して", "sync the docs", "update CLAUDE.md after this change", "実装に合わせてドキュメントを直して", or notices that docs have drifted from the codebase. Diffs git history to identify what changed, proposes targeted updates to CLAUDE.md, docs/architecture.md, docs/requirements.md, and README.md, then applies only approved changes.
allowed-tools: Read, Write, Edit, Bash, Glob
argument-hint: "[feature-description | (no args = read git diff)]"
---

実装変更に合わせてドキュメントを更新するスキル。変更内容を把握し、更新案をユーザーに提示・承認後に適用する。

## Step 1: 変更内容の把握

### 引数がある場合

`$ARGUMENTS` を機能の説明として使用する。

### 引数がない場合

`git diff main...HEAD` を実行して変更内容を読み取る。
変更がない場合は「作業ブランチに変更がありません」と報告して終了する。

## Step 2: 既存ドキュメントの読み込み

以下のファイルが存在する場合は読み込む:

- `CLAUDE.md` — プロジェクト概要・技術スタック・開発規約・よく使うコマンド
- `docs/architecture.md` — 設計方針・主要コンポーネント・データモデル
- `docs/requirements.md` — 要件一覧・MoSCoW スコープ
- `README.md` — プロジェクト説明・セットアップ手順・使い方

存在しないファイルはスキップする。

## Step 3: 更新が必要な箇所の特定

変更内容と各ドキュメントを照合し、以下の観点で更新候補を列挙する:

| 観点         | 確認内容                                                                              |
| ------------ | ------------------------------------------------------------------------------------- |
| 新機能       | `CLAUDE.md` のコマンド一覧・`docs/architecture.md` のコンポーネント説明に追記が必要か |
| API変更      | `README.md` の使い方・設定例が古くなっていないか                                      |
| 設計変更     | `docs/architecture.md` のデータモデル・方針が実装と乖離していないか                   |
| 要件変更     | `docs/requirements.md` のスコープ・完了条件が更新されているか                         |
| コマンド変更 | `CLAUDE.md` の「よく使うコマンド」セクションが最新か                                  |

更新が不要なファイルは一覧から除外し、その理由を添える。

## Step 4: 更新案の提示と承認

更新が必要なファイルごとに以下の形式で提示する:

```
### docs/architecture.md

**変更箇所**: [セクション名]
**現在の記述**: （引用）
**更新案**: （提案内容）
```

提示後、「この内容でドキュメントを更新しますか？」と確認する。
個別に承認・却下できるよう、ファイルごとに確認する。

## Step 5: 承認された更新の適用

承認されたファイルのみを Edit ツールで更新する。
更新後、変更した箇所のファイルパスと行番号を報告する。

## 注意事項

- **承認なしに書き込まない**: 必ず Step 4 でユーザーの承認を得てから Edit を実行する
- **最小限の更新**: ドキュメント全体を書き直すのではなく、変更に関係する箇所のみ更新する
- **事実のみ記載**: 実装されていない機能・未確定の設計はドキュメントに含めない
