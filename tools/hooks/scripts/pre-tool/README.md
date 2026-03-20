# PreToolUse スクリプト

ツール実行前に呼ばれるフックスクリプトです。終了コード `2` でツール実行をブロックできます。

## スクリプト一覧

| スクリプト | 説明 |
|---|---|
| [block-dangerous-rm.sh](block-dangerous-rm.sh) | `rm -rf /` など危険な削除コマンドをブロック |

## stdin の形式

```json
{
  "tool_name": "Bash",
  "tool_input": {
    "command": "rm -rf /tmp/foo"
  }
}
```

`jq` で必要なフィールドを取得します。

## 終了コード

| コード | 意味 |
|---|---|
| `0` | 許可（続行） |
| `1` | 警告（stdout を Claude に渡して続行させるかを判断させる） |
| `2` | 強制ブロック（ツール実行を中断） |

## インストール例

```bash
cp block-dangerous-rm.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/block-dangerous-rm.sh
```

settings.json への追加:
```json
{
  "hooks": {
    "PreToolUse": [{
      "matcher": "Bash",
      "hooks": [{"type": "command", "command": "~/.claude/hooks/block-dangerous-rm.sh"}]
    }]
  }
}
```
