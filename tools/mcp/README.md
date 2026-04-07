# MCP サーバー設定テンプレート

各 MCP サーバーの `.mcp.json` テンプレートです。

## サーバー一覧

| サーバー                          | 説明                                             | 必要な設定         |
| --------------------------------- | ------------------------------------------------ | ------------------ |
| [github](github/)                 | GitHub API（PR・Issue・コード検索）              | `GITHUB_TOKEN`     |
| [filesystem](filesystem/)         | ローカルファイルシステムへのアクセス             | 許可ディレクトリ   |
| [playwright](playwright/)         | ブラウザ操作・表示確認・コンソールエラー検出     | なし               |
| [sandbox-runner](sandbox-runner/) | サンドボックス外で package.json スクリプトを実行 | `ALLOWED_PROJECTS` |

## 使い方

### インストーラーで追加（推奨）

```bash
npx github:t6adev/claude-code-tools
```

MCP サーバー設定を選ぶと `claude mcp add` 経由でインストールされます。

### 手動で追加

```bash
# プロジェクトスコープ（チーム共有）
claude mcp add --scope project playwright -- npx @playwright/mcp@latest --caps core,console,vision

# ユーザースコープ（個人利用）
claude mcp add --scope user github -- npx -y @modelcontextprotocol/server-github
```

各サーバーの詳細なコマンドは各ディレクトリの README.md を参照してください。

## `claude mcp add` のオプション

```bash
claude mcp add [options] <name> -- <command> [args...]
```

| オプション          | 説明                                                  |
| ------------------- | ----------------------------------------------------- |
| `--scope project`   | プロジェクトルートの `.mcp.json` に追加（チーム共有） |
| `--scope user`      | `~/.claude/.mcp.json` に追加（個人利用）              |
| `--env KEY=VALUE`   | 環境変数を設定（複数指定可）                          |
| `--transport stdio` | トランスポート方式を指定（デフォルト: stdio）         |

環境変数は `${VAR_NAME}` で参照できます（Claude Code が実行時に展開）。

## 新しいサーバーを追加する

[`docs/mcp-authoring-guide.md`](../../docs/mcp-authoring-guide.md) を参照してください。
