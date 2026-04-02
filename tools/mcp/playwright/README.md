# Playwright MCP サーバー

ブラウザを自動操作して Web アプリの表示確認・コンソールエラー検出・スクリーンショット取得を Claude から行えます。

## 使える操作

- ページへのナビゲーション（localhost 含む）
- スクリーンショット取得（視覚的な表示確認）
- ブラウザコンソールのエラー・警告の取得
- DOM スナップショット（アクセシビリティツリー）
- クリック・フォーム入力などのインタラクション
- JavaScript の実行
- PDF 生成

## 前提条件

- Node.js がインストールされていること（npx が使える状態）
- 追加の認証情報は不要

## インストール

### CLI で追加（推奨）

```bash
claude mcp add playwright -- npx @playwright/mcp@latest --caps core,console,vision
```

### プロジェクトへ追加

```bash
cp ~/path/to/claude-code-tools/tools/mcp/playwright/.mcp.json ./.mcp.json
```

`.mcp.json` をプロジェクトルートに置いてコミットします。

## Capabilities（`--caps`）

| Cap       | 説明                                       |
| --------- | ------------------------------------------ |
| `core`    | ナビゲーション・クリック・入力・DOM 取得   |
| `console` | ブラウザコンソールのログ・エラー取得       |
| `vision`  | スクリーンショット取得（視覚的な確認向け） |

デフォルトは `core` のみ。用途に応じて組み合わせます:

```bash
# コンソールエラー検出のみ（トークン節約）
claude mcp add playwright -- npx @playwright/mcp@latest --caps core,console

# 視覚確認も含む（フル機能）
claude mcp add playwright -- npx @playwright/mcp@latest --caps core,console,vision
```

`vision` を外すとアクセシビリティツリーベースの操作になり、トークン消費を抑えられます。

## 設定ファイル

```json
{
  "mcpServers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp@latest", "--caps", "core,console,vision"]
    }
  }
}
```

## 使用例

Playwright MCP を追加後、Claude に以下のように依頼できます:

- 「http://localhost:3000 を開いてコンソールエラーがないか確認して」
- 「トップページのスクリーンショットを撮って表示崩れがないか見て」
- 「ログインフォームにテストデータを入力して送信して」

## 参考リンク

- [microsoft/playwright-mcp](https://github.com/microsoft/playwright-mcp)
