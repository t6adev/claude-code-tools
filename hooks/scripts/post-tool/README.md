# PostToolUse / Stop スクリプト

ツール実行後または Claude の応答終了後に呼ばれるスクリプトです。

## スクリプト一覧

| スクリプト | イベント | 説明 |
|---|---|---|
| [notify-on-stop.sh](notify-on-stop.sh) | `Stop` | 応答完了時にデスクトップ通知を送る |

## インストール例（notify-on-stop）

```bash
cp notify-on-stop.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/notify-on-stop.sh
```

settings.json への追加:
```json
{
  "hooks": {
    "Stop": [{
      "matcher": "",
      "hooks": [{"type": "command", "command": "~/.claude/hooks/notify-on-stop.sh"}]
    }]
  }
}
```
