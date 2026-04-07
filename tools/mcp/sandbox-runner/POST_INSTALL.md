サーバーファイルを ~/.claude/mcp-servers/sandbox-runner/ にコピーし、
グローバル MCP サーバーとして登録しました。

インストーラーを実行したプロジェクトのパスは自動的に
ALLOWED_PROJECTS に追加されています。

別のプロジェクトを追加する場合は、インストーラーをそのプロジェクトの
ディレクトリで再実行してください。既存のパスに自動的にマージされます。

現在の設定を確認:

claude mcp get sandbox-runner

手動でプロジェクトを追加する場合:

claude mcp add --scope user sandbox-runner \
 -e ALLOWED_PROJECTS=/path/to/project-a,/path/to/project-b \
 -- node ~/.claude/mcp-servers/sandbox-runner/server.js
