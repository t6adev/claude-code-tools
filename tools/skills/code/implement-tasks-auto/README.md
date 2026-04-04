# implement-tasks-auto

GitHub Issue のリストを受け取り、依存関係を解析した上で git worktree 内で自律的に実装し、PR を作成するスキル。
**独立した Issue は Agent tool で並列実行**し、スループットを最大化する。

## 使い方

```
/implement-tasks-auto #1 #2 #3
/implement-tasks-auto 10 12 15
/implement-tasks-auto https://github.com/org/repo/issues/10 https://github.com/org/repo/issues/12
```

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール・認証済みであること
- パーミッションが許可されていること（後述）

## パーミッション設定

このスキルはユーザー確認なしで自律的に動作するため、全ツールの実行許可が必要。
2 つの方法がある。

### 方法 A: `--dangerously-skip-permissions` で起動（手軽）

```bash
claude --dangerously-skip-permissions
```

全パーミッションプロンプトをスキップする。設定ファイルの変更は不要。

> **注意**: 公式ドキュメントではコンテナや VM などの隔離環境での使用が推奨されている。
> ローカル環境で使う場合はリポジトリの内容を信頼できることを確認すること。

### 方法 B: `settings.json` で許可（安全寄り）

`.claude/settings.json`（プロジェクト単位）または `~/.claude/settings.json`（グローバル）に追加:

```json
{
  "permissions": {
    "allow": [
      "Bash(git *)",
      "Bash(gh *)",
      "Bash(pnpm *)",
      "Bash(npm *)",
      "Bash(yarn *)",
      "Bash(cd *)",
      "Bash(tail *)",
      "Bash(head *)",
      "Bash(cat *)",
      "Bash(ls *)",
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep"
    ]
  }
}
```

> **ポイント**: Claude Code は `&&` やパイプで繋がれたコマンドを**個別に**パーミッションチェックする。
> 例えば `cd /path && pnpm fix 2>&1 | tail -3` は `cd`・`pnpm`・`tail` の 3 つそれぞれに許可が必要。
> そのため `tail`・`head` 等のユーティリティコマンドも許可リストに含める。
>
> **注意**: settings.json の変更はセッション開始時に読み込まれる。
> 設定を変更した場合は Claude Code を再起動すること。

### Sandbox 環境での追加設定

Sandbox が有効な場合、worktree はリポジトリの親ディレクトリ（`../`）に作成されるため、デフォルトでは書き込みがブロックされる。
プロジェクトの `.claude/settings.json` に以下を追加する:

```json
{
  "sandbox": {
    "filesystem": {
      "allowWrite": ["../"]
    }
  }
}
```

## 動作の概要

```
Issue リスト取得（並列 gh issue view）
    |
依存関係の解析 → トポロジカルソート → レベル別実行計画を出力
    |
プロジェクトコンテキスト収集 → CLAUDE.md 更新（必要な場合）
    |
+-- Level 0（最大 3 並列）-------------------------------+
|  Agent: #10 worktree → 実装 → PR                       |
|  Agent: #11 worktree → 実装 → PR   （同時実行）        |
+--------------------------------------------------------+
    |  全 Agent 完了 → コミット/PR 存在を検証 → 未完了は補完
    |  依存先 PR のマージ状態を確認 → リベース対応
+-- Level 1（最大 3 並列）-------------------------------+
|  Agent: #12 worktree(base: #10) → 実装 → PR            |
|  Agent: #14 worktree(base: #11) → 実装 → PR            |
+--------------------------------------------------------+
    |  全 Agent 完了 → 検証 → 補完
+-- Level 2 ... -----------------------------------------+
    |
完了レポート出力
```

**ユーザー確認なしに全タスクを実行する。**

### 並列実行の効果

- 独立 Issue は最大 3 並列で実行（レートリミット回避のため上限あり）
- 3 件を超える場合はバッチに分割して順次実行
- 各 Agent は独立した worktree で作業するため衝突しない

### 検証が通らない場合

- 最大 3 回まで修正を試みる
- 解決しない場合も PR を作成し、コメントで失敗内容と修正試行の詳細を記録する
- コミットメッセージは `Closes` ではなく `Refs` を使い、Issue の自動クローズを防ぐ

### 依存関係のあるタスク

- 依存先の Issue ブランチをベースにしてブランチを作成する
- PR のベースブランチも依存先のブランチに設定される
- マージは依存元（親）から順に行う
- 依存先 PR が実行中にマージされた場合、自動で `origin/main` にリベースし PR ベースを更新する

### Worktree の扱い

- 作業完了後も worktree は**削除しない**（後から修正できるようにするため）
- PR がマージされたら `git worktree remove ../<dir>` で削除する

## 関連スキル

| スキル               | 役割                                          |
| -------------------- | --------------------------------------------- |
| `/implement-task`    | 単一 Issue の実装フロー（本スキルが内部参照） |
| `/workflow-planning` | 汎用の計画・実行・検証サイクル                |
| `/pr-review-router`  | 作成した PR のレビュー                        |
| `/impact-analysis`   | 変更の影響範囲を事前に分析                    |
