# task-breakdown

既存プロジェクトのペインポイントとコードベースの健全性を診断し、GitHub IssuesとProject Boardに改善タスクとして登録するスキル。

## 使い方

```
/task-breakdown
/task-breakdown 42        # 既存の GitHub Project (番号42) にタスクを追加する
```

## このスキルで解決できること

- GitHub Projectでのタスク管理をしていない既存プロジェクトの整理
- 技術的負債・ドキュメント不足・テスト不足のIssue化
- コーディングエージェントや新規エンジニアが作業しやすい状態への整備

## 推奨ワークフロー

```
/analyze-project   # ドキュメントを整備する（未実施の場合）
       ↓
/task-breakdown    # ペインポイントを洗い出してGitHub Projectに登録する
       ↓
/implement-task #N # 登録したIssueを1件ずつ実装する
```

## フェーズ構成

| フェーズ                | 内容                                                          |
| ----------------------- | ------------------------------------------------------------- |
| スタート時確認          | ドキュメント有無・既存Issue・GitHub CLI認証を確認             |
| Phase 1: ヒアリング     | 何が痛いか（5カテゴリ）を対話形式で引き出す                   |
| Phase 2: 診断スキャン   | コードから客観的な問題（TODO・大ファイル・空のcatch等）を検出 |
| Phase 3: タスク分解     | 「1タスク=1PR」の粒度でカテゴリ別に整理、ユーザーと合意       |
| Phase 4: GitHub登録     | Issue作成 + Project Board登録 + ラベル自動作成                |
| Phase 5: 次のアクション | `/implement-task` や `/doc-sync` への案内                     |

## タスクカテゴリ

| カテゴリ         | Prefix      | 例                                                         |
| ---------------- | ----------- | ---------------------------------------------------------- |
| ドキュメント補完 | `docs:`     | `docs: POST /users エンドポイントの仕様を追記する`         |
| テスト追加       | `test:`     | `test: src/payments/ モジュールのユニットテストを追加する` |
| 技術的負債解消   | `refactor:` | `refactor: UserService を役割別に分割する`                 |
| CI/CD修復        | `chore:`    | `chore: GitHub Actions の型チェックステップを修正する`     |
| セキュリティ修正 | `fix:`      | `fix: API キーを環境変数に移行する`                        |
| 調査・決定       | 調査:       | `調査: legacy-auth.ts の使用箇所を確認し廃止計画を立てる`  |

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール済みであること
  - 未認証の場合は dry-run モードで `docs/task-backlog.md` に出力

## dry-run モード

`gh auth login` が未設定の環境では、GitHub への登録を行わず `docs/task-backlog.md` にタスク一覧をMarkdownで出力するdry-runモードで動作します。
