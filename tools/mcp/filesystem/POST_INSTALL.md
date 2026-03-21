.mcp.json 内のパスプレースホルダーを実際のパスに書き換えてください:

"/path/to/allowed/directory" → Claude にアクセスを許可するディレクトリのパス

例:
"/Users/yourname/projects"

複数のディレクトリを許可する場合はカンマ区切りで追加できます:
"args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/yourname/projects", "/tmp"]
