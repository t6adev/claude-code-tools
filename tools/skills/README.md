# Skills

スラッシュコマンドの一覧です。

## git

| スキル                            | コマンド        | 説明                                                                 |
| --------------------------------- | --------------- | -------------------------------------------------------------------- |
| [pre-pr-check](git/pre-pr-check/) | `/pre-pr-check` | PR作成前に検証コマンド・コミット形式・ドキュメント更新を一括チェック |

## code

| スキル                                         | コマンド                               | 説明                                                                             |
| ---------------------------------------------- | -------------------------------------- | -------------------------------------------------------------------------------- |
| [explain](code/explain/)                       | `/explain [file or function]`          | コードを平易な言葉で説明                                                         |
| [pr-review-router](code/pr-review-router/)     | `/pr-review-router [intent]`           | レビュー意図を解析し code-review / pr-review-toolkit へルーティング              |
| [node-project-setup](code/node-project-setup/) | `/node-project-setup [directory or .]` | pnpm・TypeScript・並列 check パターンで Node.js プロジェクトを設定               |
| [start-webapp](code/start-webapp/)             | `/start-webapp`                        | 新規Webアプリの立ち上げウィザード（ヒアリング→設計→タスク化→GitHub Project登録） |
| [implement-task](code/implement-task/)         | `/implement-task [issue-url\|#number]` | GitHub Issue を起点に実装・検証・PR作成まで一貫して実行                          |
| [debug-assist](code/debug-assist/)             | `/debug-assist [error-message]`        | エラー・スタックトレースを解析して原因仮説と修正方針を提示                       |
| [impact-analysis](code/impact-analysis/)       | `/impact-analysis [file\|symbol]`      | ファイル・シンボルの変更前に影響を受ける依存元とテストを列挙                     |

## docs

| スキル                     | コマンド                          | 説明                                                            |
| -------------------------- | --------------------------------- | --------------------------------------------------------------- |
| [doc-sync](docs/doc-sync/) | `/doc-sync [feature-description]` | 実装変更に合わせて CLAUDE.md・architecture.md・README.md を更新 |

## meta

| スキル                                       | コマンド             | 説明                                                           |
| -------------------------------------------- | -------------------- | -------------------------------------------------------------- |
| [workflow-planning](meta/workflow-planning/) | `/workflow-planning` | 非自明なタスクの計画・実行・検証サイクル                       |
| [subagent-strategy](meta/subagent-strategy/) | `/subagent-strategy` | サブエージェントを活用した並列実行・調査委譲・コンテキスト管理 |
| [self-improvement](meta/self-improvement/)   | `/self-improvement`  | 修正・指摘を受けた際の学習記録と自己改善ループ                 |

## インストール方法

各スキルの `README.md` を参照してください。

グローバルへのインストール（全プロジェクトで利用可能）:

```bash
REPO=~/path/to/claude-code-tools

ln -s "$REPO/skills/code/explain" ~/.claude/skills/explain
ln -s "$REPO/skills/meta/workflow-planning" ~/.claude/skills/workflow-planning
ln -s "$REPO/skills/meta/subagent-strategy" ~/.claude/skills/subagent-strategy
ln -s "$REPO/skills/meta/self-improvement" ~/.claude/skills/self-improvement
ln -s "$REPO/skills/code/pr-review-router" ~/.claude/skills/pr-review-router
```

## 新しいスキルを追加する

[`docs/skill-authoring-guide.md`](../../docs/skill-authoring-guide.md) を参照してください。
