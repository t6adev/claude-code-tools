# MCP サーバー設定作成ガイド

## ファイル構成

```
tools/mcp/<server-name>/
├── .mcp.json    # 設定テンプレート（必須）
└── README.md    # 使い方・前提条件（必須）
```

## plugin-dev を活用する

[`plugin-dev`](../tools/recommended-plugins/plugin-dev/) プラグインをインストールすると、MCP 設定を AI がガイドしてくれます。

```
# MCP 設定の相談
「stdio MCP サーバーを追加したい」
「SSE サーバーに OAuth 認証を設定したい」
→ plugin-dev の mcp-integration スキルが自動でロードされる
```

`mcp-integration` スキルが提供するもの:

- サーバータイプ別の設定例（stdio / SSE / HTTP / WebSocket）
- `.mcp.json` vs `plugin.json` の使い分け
- OAuth・トークン・環境変数による認証パターン
- `${CLAUDE_PLUGIN_ROOT}` / ユーザー環境変数の展開方法

## 追加後の手順

1. `tools/mcp/README.md` のテーブルに追記する
2. PR を作成する（[pr-checklist.md](pr-checklist.md) 参照）
