# MCP サーバー設定テンプレート

各 MCP サーバーの `.mcp.json` テンプレートです。

## サーバー一覧

| サーバー                  | 説明                                         | 必要な設定       |
| ------------------------- | -------------------------------------------- | ---------------- |
| [github](github/)         | GitHub API（PR・Issue・コード検索）          | `GITHUB_TOKEN`   |
| [filesystem](filesystem/) | ローカルファイルシステムへのアクセス         | 許可ディレクトリ |
| [playwright](playwright/) | ブラウザ操作・表示確認・コンソールエラー検出 | なし             |

## 使い方

### プロジェクトへ追加（チーム共有）

`.mcp.json` をプロジェクトルートにコピーして編集します:

```bash
REPO=~/path/to/claude-code-tools

cp "$REPO/mcp/github/.mcp.json" ./.mcp.json
# 環境変数名・設定を確認して必要に応じて編集
```

`.mcp.json` は git にコミットします（機密情報は環境変数で渡す）。

### グローバルへ追加（個人利用）

```bash
claude mcp add --transport stdio github \
  --scope user \
  -- npx -y @modelcontextprotocol/server-github
```

## `.mcp.json` フォーマット

```json
{
  "mcpServers": {
    "<server-name>": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "<package-name>"],
      "env": {
        "API_KEY": "${MY_API_KEY}"
      }
    }
  }
}
```

環境変数は `${VAR_NAME}` で参照します（シェルは展開しない、Claude Code が展開する）。

## 新しいサーバーを追加する

[`docs/mcp-authoring-guide.md`](../../docs/mcp-authoring-guide.md) を参照してください。
