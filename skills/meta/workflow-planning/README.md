# workflow-planning

非自明なタスクに取り組む際の計画・実行・検証サイクルを定義するスキルです。

## 使い方

```
/workflow-planning
```

引数は不要です。タスクの開始時や再計画が必要になった時に呼び出します。

## いつ使うか

- 3ステップ以上の作業が見込まれるタスク
- アーキテクチャや設計上の判断を伴う変更
- 複数ファイルにまたがる実装
- バグ修正・リファクタリングの着手時
- 「計画を立てて」「この機能を実装して」「バグを直して」といったリクエスト

## 動作

1. **計画フェーズ**: `tasks/todo.md` にチェックリスト形式で計画を作成し、ユーザーへ共有・確認
2. **実行フェーズ**: 各ステップ完了時にチェックを更新。行き詰まったら即座に再計画
3. **検証フェーズ**: テスト実行・ログ確認・差分確認を経てタスクを完了とマーク

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/skills/meta/workflow-planning ~/.claude/skills/workflow-planning

# プロジェクト（コピー）
cp -r ~/path/to/claude-code-tools/skills/meta/workflow-planning .claude/skills/
```
