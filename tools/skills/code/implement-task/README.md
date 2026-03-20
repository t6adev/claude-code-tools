# implement-task

GitHub Issue を起点に、コードの実装から PR 作成までを一貫して行うスキル。

## 使い方

```
/implement-task [issue-url | #number]
```

## 例

```
/implement-task 42
/implement-task #42
/implement-task https://github.com/org/repo/issues/42
/implement-task        ← 引数なしでオープン Issue 一覧を表示
```

## 前提条件

- カレントディレクトリが対象リポジトリのルートであること
- `gh` CLI がインストール・認証済みであること

## 動作の概要

Issue の取得 → コードベース探索 → 実装計画（ユーザー承認） → 実装 → 検証 → PR 作成

**ユーザーが承認するゲートが 2 箇所あります:**

1. Phase 1: 完了条件の確認
2. Phase 3: 実装計画の承認（ここまで承認されないと実装を開始しない）

## 関連スキル

| スキル                | 役割                                  |
| --------------------- | ------------------------------------- |
| `/start-webapp`       | プロジェクトの立ち上げと Issue の生成 |
| `/workflow-planning`  | 汎用の計画・実行・検証サイクル        |
| `/pr-review-router`   | 作成した PR のレビュー                |
| `/node-project-setup` | 環境セットアップ系 Issue の実行       |
