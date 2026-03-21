#!/usr/bin/env bash
# PreToolUse hook: Bash ツールで危険な rm コマンドをブロックする
#
# ブロック対象:
#   rm -rf /
#   rm -rf /home
#   rm -rf /Users
#   rm -rf ~ (ホームディレクトリ全体)
#   rm -rf /* など
#
# 使い方例（settings.json）:
#   {
#     "hooks": {
#       "PreToolUse": [{
#         "matcher": "Bash",
#         "hooks": [{"type": "command", "command": "~/.claude/hooks/block-dangerous-rm.sh"}]
#       }]
#     }
#   }

set -euo pipefail

# stdin から tool_input を読み込む
INPUT=$(cat)

# Bash ツール以外はスキップ
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
if [[ "$TOOL_NAME" != "Bash" ]]; then
  exit 0
fi

COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // ""')

# 危険なパターンを検出
DANGEROUS_PATTERNS=(
  'rm[[:space:]].*-[a-zA-Z]*r[a-zA-Z]*f[[:space:]].*/'  # rm -rf /...
  'rm[[:space:]].*-[a-zA-Z]*f[a-zA-Z]*r[[:space:]].*/'  # rm -fr /...
  'rm[[:space:]].*-[a-zA-Z]*r[a-zA-Z]*f[[:space:]]*~'   # rm -rf ~
  'rm[[:space:]].*-[a-zA-Z]*f[a-zA-Z]*r[[:space:]]*~'   # rm -fr ~
)

for PATTERN in "${DANGEROUS_PATTERNS[@]}"; do
  if echo "$COMMAND" | grep -qE "$PATTERN"; then
    # 安全なパスの除外リスト（プロジェクト内など）
    # /tmp, カレントディレクトリ以下は許可
    if echo "$COMMAND" | grep -qE 'rm.*(/tmp/|\./)'; then
      continue
    fi

    echo "BLOCKED: 危険な rm コマンドを検出しました: $COMMAND"
    echo "システムディレクトリやホームディレクトリ全体の削除は許可されていません。"
    echo "削除したい場合は、より具体的なパスを指定してください。"
    exit 2
  fi
done

exit 0
