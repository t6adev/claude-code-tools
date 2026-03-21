#!/usr/bin/env bash
# Notification hook (permission_prompt): 許可を求められたときにデスクトップ通知を送る
#
# 対応OS: macOS（osascript）、Linux（notify-send）
#
# 使い方例（settings.json）:
#   {
#     "hooks": {
#       "Notification": [{
#         "matcher": "permission_prompt",
#         "hooks": [{"type": "command", "command": "~/.claude/hooks/notify-on-permission.sh"}]
#       }]
#     }
#   }

set -euo pipefail

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | jq -r '.message // "Claude がコマンドの許可を求めています"')
TITLE=$(echo "$INPUT" | jq -r '.title // "Claude Code - 許可が必要です"')

# macOS
if command -v osascript &>/dev/null; then
  osascript -e "display notification \"$MESSAGE\" with title \"$TITLE\""
  exit 0
fi

# Linux (libnotify)
if command -v notify-send &>/dev/null; then
  notify-send "$TITLE" "$MESSAGE"
  exit 0
fi

# フォールバック: ターミナルベル
echo -e "\a"
exit 0
