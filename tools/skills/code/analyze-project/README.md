# analyze-project

既存プロジェクトのコードベースを解析し、CLAUDE.md・docs/architecture.md を生成・更新するスキル。
コーディングエージェントが実装タスクをすみやかに実行できるコンテキストドキュメントを整備する。

## 使い方

```
/analyze-project [goal]
```

| 引数         | 用途                                               |
| ------------ | -------------------------------------------------- |
| `migration`  | フレームワーク・インフラ移行前の準備               |
| `feature`    | 新機能実装前のコンテキスト整備                     |
| `onboarding` | 新規メンバー向けのオンボーディングドキュメント作成 |
| `refresh`    | 既存ドキュメントを現状コードに合わせて更新         |
| （省略）     | 目的をインタラクティブに確認してから実行           |

## 例

```
# 移行作業の事前準備
/analyze-project migration

# 新機能開発の前に実施
/analyze-project feature

# 引数なしで目的を対話的に確認
/analyze-project
```

## 動作

1. 目的・モードを確認する（引数なしの場合はインタラクティブに確認）
2. 既存ドキュメントの有無をチェックする
3. コードベースを体系的に探索する（技術スタック・ディレクトリ構成・データモデル・APIなど）
4. 以下のドキュメントを生成・更新する:
   - `CLAUDE.md` — 技術スタック・開発規約・よく使うコマンド・実装パターン
   - `docs/architecture.md` — システム構成・コンポーネント・データモデル・拡張ポイント
   - `docs/migration-plan.md` — 移行ステップ・影響範囲（`migration` モードのみ）
5. 読み取れなかった項目を `[要確認]` とマークしてユーザーに提示する
6. 次のアクション（`/implement-task` など）を提案する

## 他スキルとの連携

```
/analyze-project migration   →  /implement-task で migration-plan.md の各ステップを実行
/analyze-project feature     →  /implement-task で新機能 Issue を実装
/analyze-project refresh     →  /doc-sync で今後の変更との同期フローを確立
```

`implement-task` や `feature-dev` はプロジェクトのコンテキストドキュメントが存在することを前提としている。
このスキルを先に実行することで、それらのスキルがより正確・迅速に動作する。
