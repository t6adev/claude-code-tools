# Skills

スラッシュコマンドの一覧です。

## code

| スキル                                     | コマンド                      | 説明                                                                |
| ------------------------------------------ | ----------------------------- | ------------------------------------------------------------------- |
| [explain](code/explain/)                               | `/explain [file or function]`          | コードを平易な言葉で説明                                            |
| [pr-review-router](code/pr-review-router/)             | `/pr-review-router [intent]`           | レビュー意図を解析し code-review / pr-review-toolkit へルーティング |
| [node-project-setup](code/node-project-setup/)         | `/node-project-setup [directory or .]` | pnpm・TypeScript・並列 check パターンで Node.js プロジェクトを設定  |

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
