# Recommended Plugins

このディレクトリは、Claude Code の plugin エコシステムから厳選した推薦 plugin のカタログです。
自前で実装するより優れた実装が公式・OSSとして提供されているものを記録しています。

## Plugin 一覧

| Plugin | ソース | 概要 |
|--------|--------|------|
| [`commit-commands`](commit-commands/) | anthropics/claude-plugins-official | `/commit` などの git workflow 自動化コマンド |
| [`code-review`](code-review/) | anthropics/claude-plugins-official | PR レビューの自動化（parallel agents） |

## 一括インストール

リポジトリルートの `install.sh` を使うと、skills・agents・推薦 plugins を一括でインストールできます。

```bash
./install.sh
```

## Plugin を追加する

1. `recommended-plugins/<plugin-name>/README.md` を作成
2. このファイルの一覧に追記
3. `install.sh` の plugin インストール処理に追記

### README.md のテンプレート

各 plugin の README.md は以下の構成で記載する：

```markdown
# plugin-name

## 概要
## ソース
## 採用理由
## インストール
## 提供コマンド / 機能
```
