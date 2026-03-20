# commit-commands

## 概要

Git コミット・プッシュ・PR 作成などのワークフローを自動化するスラッシュコマンドを提供します。

## ソース

- Repository: https://github.com/anthropics/claude-code
- Plugin path: `plugins/commit-commands/`
- Author: Anthropic

## 採用理由

このリポジトリの `skills/git/commit` と同等の機能を、公式がより充実した形で提供している。
Conventional Commits 形式の生成・ステージング・プッシュまでを一貫して扱える。

## インストール

インストーラーが [`plugin.yaml`](plugin.yaml) を自動認識してインストールします。

```bash
npx github:t6adev/claude-code-tools
```

手動インストールする場合:

```bash
claude plugin marketplace add anthropics/claude-code  # registry の登録
claude plugin install commit-commands@claude-code-plugins  # <plugin_id>@<channel>
```

## 提供コマンド / 機能

| コマンド  | 説明                                                   |
| --------- | ------------------------------------------------------ |
| `/commit` | ステージ済み変更を Conventional Commits 形式でコミット |
| `/push`   | コミットしてリモートへプッシュ                         |
| `/pr`     | PR を作成                                              |
