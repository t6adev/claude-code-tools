#!/usr/bin/env bash
# block-secret-files.sh のテストスクリプト

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HOOK="$SCRIPT_DIR/block-secret-files.sh"

PASS=0
FAIL=0

# ヘルパー関数

run_hook() {
  local json="$1"
  echo "$json" | bash "$HOOK"
}

# exit code だけ確認する（出力は捨てる）
exit_code_of() {
  local json="$1"
  echo "$json" | bash "$HOOK" >/dev/null 2>&1
  echo $?
}

assert_blocked() {
  local desc="$1"
  local json="$2"
  local code
  code=$(echo "$json" | bash "$HOOK" >/dev/null 2>&1; echo $?)
  if [[ "$code" == "2" ]]; then
    echo "PASS: $desc"
    ((PASS++))
  else
    echo "FAIL: $desc (expected exit 2, got $code)"
    ((FAIL++))
  fi
}

assert_allowed() {
  local desc="$1"
  local json="$2"
  local code
  code=$(echo "$json" | bash "$HOOK" >/dev/null 2>&1; echo $?)
  if [[ "$code" == "0" ]]; then
    echo "PASS: $desc"
    ((PASS++))
  else
    echo "FAIL: $desc (expected exit 0, got $code)"
    ((FAIL++))
  fi
}

make_read_input() {
  local path="$1"
  printf '{"tool_name":"Read","tool_input":{"file_path":"%s"}}' "$path"
}

make_other_tool_input() {
  local tool="$1"
  local path="$2"
  printf '{"tool_name":"%s","tool_input":{"file_path":"%s"}}' "$tool" "$path"
}

# ── ブロック対象 ──────────────────────────────────────────────

# .env 系
assert_blocked ".env"                    "$(make_read_input "/project/.env")"
assert_blocked ".env.local"              "$(make_read_input "/project/.env.local")"
assert_blocked ".env.production"         "$(make_read_input "/project/.env.production")"
assert_blocked ".env.test"               "$(make_read_input "/project/.env.test")"

# 秘密鍵・証明書
assert_blocked "server.pem"              "$(make_read_input "/certs/server.pem")"
assert_blocked "server.key"              "$(make_read_input "/certs/server.key")"
assert_blocked "keystore.p12"            "$(make_read_input "/keys/keystore.p12")"
assert_blocked "keystore.pfx"            "$(make_read_input "/keys/keystore.pfx")"

# シークレットファイル
assert_blocked "app.secret"              "$(make_read_input "/config/app.secret")"
assert_blocked "app.secrets"             "$(make_read_input "/config/app.secrets")"

# SSH 秘密鍵
assert_blocked "id_rsa"                  "$(make_read_input "/home/user/.ssh/id_rsa")"
assert_blocked "id_ed25519"              "$(make_read_input "/home/user/.ssh/id_ed25519")"
assert_blocked "id_ecdsa"                "$(make_read_input "/home/user/.ssh/id_ecdsa")"
assert_blocked "id_dsa"                  "$(make_read_input "/home/user/.ssh/id_dsa")"

# 認証情報
assert_blocked "credentials"             "$(make_read_input "/aws/credentials")"
assert_blocked "credentials.json"        "$(make_read_input "/gcp/credentials.json")"
assert_blocked ".netrc"                  "$(make_read_input "/home/user/.netrc")"

# トークンファイル
assert_blocked "github.token"            "$(make_read_input "/tokens/github.token")"
assert_blocked "access.token"            "$(make_read_input "/tokens/access.token")"

# ── 許可対象 ──────────────────────────────────────────────────

# 普通のソースファイル
assert_allowed "main.ts"                 "$(make_read_input "/project/src/main.ts")"
assert_allowed "README.md"               "$(make_read_input "/project/README.md")"
assert_allowed "package.json"            "$(make_read_input "/project/package.json")"

# .env という文字列を含むが対象外のファイル
assert_blocked ".env.example"            "$(make_read_input "/project/.env.example")"
assert_allowed "dotenv.js"               "$(make_read_input "/project/src/dotenv.js")"
assert_allowed "load-env.ts"             "$(make_read_input "/project/src/load-env.ts")"

# 拡張子が似ているが対象外
assert_allowed "public.pem.bak"          "$(make_read_input "/certs/public.pem.bak")"
assert_allowed "lock.key.md"             "$(make_read_input "/docs/lock.key.md")"

# 認証情報に似た名前
assert_allowed "credentials-helper.sh"  "$(make_read_input "/scripts/credentials-helper.sh")"
assert_allowed "credentials_test.go"    "$(make_read_input "/test/credentials_test.go")"

# Read 以外のツールはファイル名が秘密ファイルでもスキップ
assert_allowed "Edit on .env (non-Read)" "$(make_other_tool_input "Edit" "/project/.env")"
assert_allowed "Bash on .env (non-Read)" "$(make_other_tool_input "Bash" "/project/.env")"

# ── サマリー ─────────────────────────────────────────────────

echo ""
echo "Results: $PASS passed, $FAIL failed"

if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
