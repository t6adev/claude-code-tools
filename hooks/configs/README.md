# Hook 設定スニペット

`~/.claude/settings.json` または `.claude/settings.json` にマージして使う JSON スニペットです。

## スニペット一覧

| ファイル | 説明 |
|---|---|
| [safety-rails.json](safety-rails.json) | 危険な rm コマンドをブロック |
| [notify-on-stop.json](notify-on-stop.json) | 応答完了時にデスクトップ通知 |

## 使い方

### 個別にマージする

既存の `settings.json` がある場合は、`hooks` セクションに追記します。

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{"type": "command", "command": "~/.claude/hooks/block-dangerous-rm.sh"}]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{"type": "command", "command": "~/.claude/hooks/notify-on-stop.sh"}]
      }
    ]
  }
}
```

### 新規の場合はそのままコピー

```bash
cp safety-rails.json ~/.claude/settings.json
# _comment / _scripts_note キーを削除してから使う
```

## スクリプトのインストール

スニペットを使う前に、対応するスクリプトをインストールしてください:

```bash
REPO=~/path/to/claude-code-tools
mkdir -p ~/.claude/hooks

cp "$REPO/hooks/scripts/pre-tool/block-dangerous-rm.sh" ~/.claude/hooks/
cp "$REPO/hooks/scripts/post-tool/notify-on-stop.sh" ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```
