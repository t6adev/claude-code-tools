サーバーファイルを ~/.claude/mcp-servers/sandbox-runner/ にコピーし、
グローバル MCP サーバーとして登録しました。

インストーラーを実行したプロジェクトのパスは自動的に
ALLOWED_PROJECTS に追加されています。
インストール時に指定したスクリプト名は ALLOWED_SCRIPTS に追加されています。

別のプロジェクトやスクリプトを追加する場合は、インストーラーを
そのプロジェクトのディレクトリで再実行してください。
既存の値に自動的にマージされます。

現在の設定を確認:

claude mcp get sandbox-runner

手動で設定を変更する場合:

claude mcp add --scope user sandbox-runner \
 -e ALLOWED_PROJECTS=/path/to/project-a,/path/to/project-b \
 -e ALLOWED_SCRIPTS=e2e,build,test \
 -- node ~/.claude/mcp-servers/sandbox-runner/server.js

git worktree を使う場合は、パスの末尾に / を付けると
そのディレクトリ配下すべてが許可されます:

claude mcp add --scope user sandbox-runner \
 -e ALLOWED_PROJECTS=/path/to/worktree-parent/ \
 -e ALLOWED_SCRIPTS=e2e,build,test \
 -- node ~/.claude/mcp-servers/sandbox-runner/server.js
