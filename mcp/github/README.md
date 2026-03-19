# GitHub MCP サーバー

GitHub の PR・Issue・コード検索・ファイル操作を Claude から直接行えます。

## 使える操作

- PR の作成・コメント・マージ
- Issue の作成・検索・クローズ
- コードの検索・ファイルの取得
- リポジトリ情報の取得

## 前提条件

GitHub Personal Access Token が必要です。

1. [GitHub Settings > Developer settings > Personal access tokens](https://github.com/settings/tokens) で作成
2. 必要なスコープ: `repo`, `read:org`（必要に応じて `write:org`）
3. 環境変数 `GITHUB_TOKEN` に設定

```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
```

## インストール

### プロジェクトへ追加

```bash
cp ~/path/to/claude-code-tools/mcp/github/.mcp.json ./.mcp.json
```

`.mcp.json` をプロジェクトルートに置いてコミットします。

### CLI で追加

```bash
claude mcp add --transport stdio github \
  -- npx -y @modelcontextprotocol/server-github
```

## 設定ファイル

```json
{
  "mcpServers": {
    "github": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

`${GITHUB_TOKEN}` は実行時に環境変数から展開されます。`.mcp.json` に直接トークンを書かないでください。
