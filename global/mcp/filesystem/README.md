# Filesystem MCP サーバー

指定したディレクトリへの安全なファイルアクセスを提供します。Claude Code の標準ツールでは届かない場所（プロジェクト外）を読み書きする場合に使います。

## 使える操作

- ファイル・ディレクトリの読み取り
- ファイルの作成・更新
- ディレクトリ一覧

アクセスは `args` に指定したディレクトリ以下に限定されます。

## インストール

```bash
cp ~/path/to/claude-code-tools/mcp/filesystem/.mcp.json ./.mcp.json
```

`.mcp.json` を開いて、許可するディレクトリを実際のパスに変更します:

```json
{
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/Documents",
        "/Users/yourname/projects"
      ]
    }
  }
}
```

複数ディレクトリを許可する場合は `args` に追加します。

## セキュリティ上の注意

- ホームディレクトリ全体（`/Users/yourname`）を許可すると範囲が広すぎます
- 必要最小限のディレクトリのみ指定してください
- `~` はシェル展開されないため、フルパスで記載してください
