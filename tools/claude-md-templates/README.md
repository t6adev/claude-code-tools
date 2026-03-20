# CLAUDE.md テンプレート

プロジェクト種別ごとの CLAUDE.md テンプレートです。

## 利用可能なテンプレート

| テンプレート | 用途 |
|---|---|
| [base](base/) | 最小限の汎用ベース。他テンプレートの出発点 |
| [typescript-node](typescript-node/) | TypeScript / Node.js サービス・CLI |
| [react-app](react-app/) | React + TypeScript フロントエンド（Vite / Next.js） |
| [python-service](python-service/) | Python サービス（FastAPI / Django） |
| [go-service](go-service/) | Go サービス |

## 使い方

```bash
# install.sh を使う場合（推奨）
~/path/to/claude-code-tools/install.sh --claude-md=typescript-node

# 手動コピーの場合
cp ~/path/to/claude-code-tools/project/claude-md-templates/typescript-node/CLAUDE.md ./CLAUDE.md
```

コピー後、プロジェクト固有の情報（プロジェクト名・コマンド・制約など）を編集してください。

## テンプレートの構成

各テンプレートには以下のセクションが含まれます:

- **よく使うコマンド** — ビルド・テスト・リントのコマンド
- **コーディング規約** — 言語・フレームワーク固有のルール
- **ディレクトリ構成** — 標準的なファイル配置
- **テスト方針** — テストフレームワーク・スタイル
- **重要な制約** — 変更してはいけない設定・注意事項

## 新しいテンプレートを追加する

1. `project/claude-md-templates/<project-type>/CLAUDE.md` を作成
2. このファイルのテーブルに追記する
3. [`docs/template-authoring-guide.md`](../../docs/template-authoring-guide.md) の手順に従ってPRを作成
