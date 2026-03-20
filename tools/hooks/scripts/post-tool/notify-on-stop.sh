#!/usr/bin/env bash
# Stop hook: Claude の応答終了時にデスクトップ通知を送る
#
# 対応OS: macOS（osascript）、Linux（notify-send）
#
# 使い方（settings.json）:
#   {
#     "hooks": {
#       "Stop": [{
#         "matcher": "",
#         "hooks": [{"type": "command", "command": "~/.claude/hooks/notify-on-stop.sh"}]
#       }]
#     }
#   }

set -euo pipefail

MESSAGE="Claude が応答を完了しました"

# macOS
if command -v osascript &>/dev/null; then
  osascript -e "display notification \"$MESSAGE\" with title \"Claude Code\""
  exit 0
fi

# Linux (libnotify)
if command -v notify-send &>/dev/null; then
  notify-send "Claude Code" "$MESSAGE"
  exit 0
fi

# フォールバック: ターミナルベル
echo -e "\a"
exit 0
