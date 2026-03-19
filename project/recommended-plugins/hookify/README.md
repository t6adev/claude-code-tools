# hookify

## 概要

マークダウン形式のルールファイルで会話パターンを監視・制御するカスタムフック管理システム。警告・ブロックアクションを設定できます。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/hookify/`
- Author: Daisy Hollman (Anthropic)

## 採用理由

このリポジトリの `hooks/` にある静的なフック設定より柔軟。YAMLフロントマター付きマークダウンでルールを記述でき、コード変更なしにフック動作を追加・管理できる。Python 3.7+ が必要。

## インストール

```bash
claude plugin install anthropics/claude-code/plugins/hookify
```

## 提供コマンド

| コマンド | 説明 |
|---|---|
| `/hookify` | 新しいフックルールを作成 |
| `/hookify:list` | 現在のフックルール一覧を表示 |
| `/hookify:configure` | 既存ルールを設定・編集 |
| `/hookify:help` | ヘルプを表示 |

## ルールの形式

```markdown
---
trigger: "pattern to watch for"
action: warn  # または block
---

ルールの説明とガイダンス
```

## 要件

- Python 3.7+
