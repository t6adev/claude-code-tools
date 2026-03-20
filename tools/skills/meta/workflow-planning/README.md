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

## feature-dev との使い分け

| 観点 | workflow-planning | feature-dev |
|---|---|---|
| タスク種別 | バグ修正・リファクタ・CI修正・機能追加すべて | 機能開発に特化 |
| 規模感 | 小〜中規模 | 中〜大規模 |
| エージェント | Claude 単体 | code-explorer / code-architect / code-reviewer（並列） |
| インストール | スキルのシンボリックリンクのみ | プラグインインストールが必要 |

**workflow-planning を選ぶとき**

- バグ修正・リファクタリング・CI修正など機能開発以外のタスク
- 単一の Claude セッションでコンテキストを保ったまま進めたいとき
- エージェントのセットアップなしに即座に始めたいとき

**feature-dev を選ぶとき**

- 新機能の設計から実装・品質レビューまでを一貫して行う大規模な機能開発
- コードベース探索（code-explorer）や設計フェーズ（code-architect）を専門エージェントに委譲したいとき
- 並列レビュー（3並列 code-reviewer）で品質保証を強化したいとき

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/skills/meta/workflow-planning ~/.claude/skills/workflow-planning

# プロジェクト（コピー）
cp -r ~/path/to/claude-code-tools/skills/meta/workflow-planning .claude/skills/
```
