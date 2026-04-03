# implement-tasks-auto

GitHub Issue のリストを受け取り、依存関係を解析した上で 1 件ずつ git worktree 内で自律的に実装し、PR を作成するスキル。

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
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep"
    ]
  }
}
```

> **注意**: settings.json の変更はセッション開始時に読み込まれる。
> 設定を変更した場合は Claude Code を再起動すること。

## 動作の概要

```
Issue リスト取得
    ↓
依存関係の解析 → トポロジカルソート → 実行計画を出力
    ↓
┌─ タスクループ（Issue ごとに繰り返し）─────────────┐
│  worktree 作成 → 依存インストール → 実装 → 検証  │
│      ↓                                            │
│  コミット → プッシュ → PR 作成                    │
│      ↓                                            │
│  次の Issue へ（worktree は残す）                  │
└───────────────────────────────────────────────────┘
    ↓
完了レポート出力
```

**ユーザー確認なしに全タスクを実行する。**

### 検証が通らない場合

- 最大 3 回まで修正を試みる
- 解決しない場合も PR を作成し、コメントで失敗内容と修正試行の詳細を記録する
- コミットメッセージは `Closes` ではなく `Refs` を使い、Issue の自動クローズを防ぐ

### 依存関係のあるタスク

- 依存先の Issue ブランチをベースにしてブランチを作成する
- PR のベースブランチも依存先のブランチに設定される
- マージは依存元（親）から順に行う

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
