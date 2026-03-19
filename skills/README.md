# Skills

スラッシュコマンドの一覧です。

## git

| スキル | コマンド | 説明 |
|---|---|---|
| [commit](git/commit/) | `/commit [scope]` | Conventional Commits 形式でコミットを作成 |
| [review-pr](git/review-pr/) | `/review-pr [base-branch]` | PR のコードレビューを実施 |

## code

| スキル | コマンド | 説明 |
|---|---|---|
| [explain](code/explain/) | `/explain [file or function]` | コードを平易な言葉で説明 |

## meta

| スキル | コマンド | 説明 |
|---|---|---|
| [workflow-planning](meta/workflow-planning/) | `/workflow-planning` | 非自明なタスクの計画・実行・検証サイクル |
| [subagent-strategy](meta/subagent-strategy/) | `/subagent-strategy` | サブエージェントを活用した並列実行・調査委譲・コンテキスト管理 |
| [self-improvement](meta/self-improvement/) | `/self-improvement` | 修正・指摘を受けた際の学習記録と自己改善ループ |

## インストール方法

各スキルの `README.md` を参照してください。

グローバルへのインストール（全プロジェクトで利用可能）:
```bash
REPO=~/path/to/claude-code-tools

ln -s "$REPO/skills/git/commit" ~/.claude/skills/commit
ln -s "$REPO/skills/git/review-pr" ~/.claude/skills/review-pr
ln -s "$REPO/skills/code/explain" ~/.claude/skills/explain
ln -s "$REPO/skills/meta/workflow-planning" ~/.claude/skills/workflow-planning
ln -s "$REPO/skills/meta/subagent-strategy" ~/.claude/skills/subagent-strategy
ln -s "$REPO/skills/meta/self-improvement" ~/.claude/skills/self-improvement
```

## 新しいスキルを追加する

[`docs/contributing.md`](../docs/contributing.md) を参照してください。
