# Recommended Plugins

このディレクトリは、Claude Code の plugin エコシステムから厳選した推薦 plugin のカタログです。
自前で実装するより優れた実装が公式・OSSとして提供されているものを記録しています。

## Plugin 一覧

| Plugin | ソース | 概要 |
|--------|--------|------|
| [`commit-commands`](commit-commands/) | anthropics/claude-code | `/commit` などの git workflow 自動化コマンド |
| [`code-review`](code-review/) | anthropics/claude-code | PR レビューの自動化（parallel agents） |
| [`pr-review-toolkit`](pr-review-toolkit/) | anthropics/claude-code | 6専門エージェントによる包括的PRレビュー |
| [`feature-dev`](feature-dev/) | anthropics/claude-code | 7フェーズ体系的フィーチャー開発ワークフロー（大規模機能開発向け） |
| [`hookify`](hookify/) | anthropics/claude-code | マークダウンルールによるカスタムフック管理 |
| [`security-guidance`](security-guidance/) | anthropics/claude-code | PreToolUseフックによるセキュリティ監視（9パターン） |
| [`frontend-design`](frontend-design/) | anthropics/claude-code | 汎用AI美学を避けた本番品質フロントエンドデザイン指針 |
| [`plugin-dev`](plugin-dev/) | anthropics/claude-code | Claude Codeプラグイン開発ツールキット |

## マーケットプレイスの登録

プラグインをインストールする前に、以下のコマンドのように必要なマーケットプレイスを登録してください：

```bash
claude plugin marketplace add <marketplace-name>
```

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
