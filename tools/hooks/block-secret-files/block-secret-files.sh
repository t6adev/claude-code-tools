#!/usr/bin/env bash
# PreToolUse hook: Read ツールで秘密情報ファイルの読み込みをブロックする
#
# ブロック対象:
#   .env, .env.* (.env.local, .env.production など)
#   *.pem, *.key, *.p12, *.pfx  (秘密鍵・証明書)
#   *.secret, *.secrets
#   id_rsa, id_ed25519, id_ecdsa, id_dsa など SSH 秘密鍵
#   credentials, credentials.json, .netrc
#   *.token
#
# 使い方例（settings.json）:
#   {
#     "hooks": {
#       "PreToolUse": [{
#         "matcher": "Read",
#         "hooks": [{"type": "command", "command": "~/.claude/hooks/block-secret-files.sh"}]
#       }]
#     }
#   }

set -euo pipefail

# stdin から tool_input を読み込む
INPUT=$(cat)

# Read ツール以外はスキップ
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // ""')
if [[ "$TOOL_NAME" != "Read" ]]; then
  exit 0
fi

FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')
BASENAME=$(basename "$FILE_PATH")

# ブロック対象パターンに一致するか確認
BLOCKED=false

# .env および .env.* パターン
if [[ "$BASENAME" == ".env" ]] || [[ "$BASENAME" == .env.* ]]; then
  BLOCKED=true
fi

# 秘密鍵・証明書
if [[ "$BASENAME" == *.pem ]] || [[ "$BASENAME" == *.key ]] || \
   [[ "$BASENAME" == *.p12 ]] || [[ "$BASENAME" == *.pfx ]]; then
  BLOCKED=true
fi

# シークレットファイル
if [[ "$BASENAME" == *.secret ]] || [[ "$BASENAME" == *.secrets ]]; then
  BLOCKED=true
fi

# SSH 秘密鍵
if [[ "$BASENAME" == "id_rsa" ]] || [[ "$BASENAME" == "id_ed25519" ]] || \
   [[ "$BASENAME" == "id_ecdsa" ]] || [[ "$BASENAME" == "id_dsa" ]]; then
  BLOCKED=true
fi

# 認証情報ファイル
if [[ "$BASENAME" == "credentials" ]] || [[ "$BASENAME" == "credentials.json" ]] || \
   [[ "$BASENAME" == ".netrc" ]]; then
  BLOCKED=true
fi

# トークンファイル
if [[ "$BASENAME" == *.token ]]; then
  BLOCKED=true
fi

if [[ "$BLOCKED" == "true" ]]; then
  echo "BLOCKED: 秘密情報ファイルの読み込みを検出しました: $FILE_PATH"
  echo "このファイルには機密情報が含まれている可能性があるため、Claude に読み込ませることができません。"
  echo "内容を共有する必要がある場合は、必要な値だけを直接会話に貼り付けてください。"
  exit 2
fi

exit 0
