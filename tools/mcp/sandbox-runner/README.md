# Sandbox Runner MCP サーバー

Claude Code のサンドボックス（macOS `sandbox-exec`）外で `package.json` スクリプトを実行するカスタム MCP サーバーです。

## 背景

Claude Code の Bash ツールはすべて sandbox 内で実行されます。Playwright/Chromium のように Mach IPC を必要とするツールは sandbox 内では動作できません。

MCP サーバーは Claude Code ランタイムが直接 spawn するため sandbox の外で動作します。この非対称性を利用して、sandbox で実行できないコマンドを MCP 経由で実行します。

## セキュリティ設計

任意コマンドの実行は不可。以下の多層防御で制約しています:

| 層                    | 対策                                                            |
| --------------------- | --------------------------------------------------------------- |
| script 名             | 正規表現 `/^[a-zA-Z0-9_:.-]+$/` で制約                          |
| script 存在確認       | `package.json` の `scripts` キーと完全一致                      |
| script ホワイトリスト | `ALLOWED_SCRIPTS` の許可リストと完全一致                        |
| cwd                   | `ALLOWED_PROJECTS` の許可リストと `path.resolve()` 後の完全一致 |
| 実行方式              | `execFile("npm", ["run", script])` — シェルを介さない           |
| 追加引数              | 受け付けない                                                    |
| 環境変数              | Claude からの注入不可（サーバープロセスの env をそのまま使用）  |
| タイムアウト          | 最大 10 分に制限                                                |

## 前提条件

- Node.js がインストールされていること

## セットアップ

### インストーラーで導入（推奨）

```bash
npx github:t6adev/claude-code-tools
```

MCP サーバー設定で `sandbox-runner` を選択すると、以下が自動的に行われます:

1. `~/.claude/mcp-servers/sandbox-runner/` にサーバーファイルをコピー
2. `npm install --production` で依存パッケージをインストール
3. `claude mcp add` で MCP サーバーとして登録

### 手動セットアップ

```bash
mkdir -p ~/.claude/mcp-servers/sandbox-runner
cp tools/mcp/sandbox-runner/{server.js,package.json,package-lock.json} ~/.claude/mcp-servers/sandbox-runner/
cd ~/.claude/mcp-servers/sandbox-runner && npm install
```

## プロジェクトとスクリプトの許可設定

インストール直後は `ALLOWED_PROJECTS` と `ALLOWED_SCRIPTS` が空です。利用したいプロジェクトのパスと許可するスクリプト名を追加してください:

```bash
claude mcp add --scope user sandbox-runner \
  -e ALLOWED_PROJECTS=/path/to/project-a \
  -e ALLOWED_SCRIPTS=e2e,build,test \
  -- node ~/.claude/mcp-servers/sandbox-runner/server.js
```

複数プロジェクトを許可する場合はカンマ区切り:

```bash
claude mcp add --scope user sandbox-runner \
  -e ALLOWED_PROJECTS=/path/to/project-a,/path/to/project-b \
  -e ALLOWED_SCRIPTS=e2e,build,test,lint \
  -- node ~/.claude/mcp-servers/sandbox-runner/server.js
```

`ALLOWED_SCRIPTS` に含まれないスクリプト名は実行が拒否されます。`package.json` に定義されていても、ホワイトリストに含まれなければ実行できません。

現在の設定を確認:

```bash
claude mcp get sandbox-runner
```

## 提供ツール

### `run_script`

package.json スクリプトを npm 経由で実行します。

```
script: "e2e"       # package.json scripts のキー名
cwd: "/path/to/project"  # ALLOWED_PROJECTS に含まれるパス
timeout_ms: 300000        # オプション（デフォルト 5 分、最大 10 分）
```

### `list_scripts`

package.json に定義されたスクリプト一覧を返します。

```
cwd: "/path/to/project"  # ALLOWED_PROJECTS に含まれるパス
```

## 使用例

Claude に対して:

```
sandbox-runner の run_script で e2e を実行して
```

## 注意事項

- MCP サーバーは sandbox の**外**で動作するため、`ALLOWED_SCRIPTS` に登録したスクリプトは制約なく実行されます
- `ALLOWED_SCRIPTS` には信頼できるスクリプトのみ追加してください。エージェントが `package.json` を書き換えてからスクリプトを実行する攻撃を防ぐため、ホワイトリストは `~/.claude.json` 側の環境変数で管理されます
- 信頼できるプロジェクトのみ `ALLOWED_PROJECTS` に追加してください
- セキュリティ上の理由から、設定はグローバル（`~/.claude.json`）にのみ保存します。プロジェクト内の `.mcp.json` は使用しないでください（Claude が書き換え可能なため）
