#!/usr/bin/env bash
# install.sh - claude-code-tools インストーラー
#
# 使い方:
#   ./install.sh                           # デフォルト: ./.claude/ に skills + agents をインストール
#   ./install.sh --claude-md               # さらに CLAUDE.md を配置（base テンプレート）
#   ./install.sh --claude-md=typescript-node # テンプレート指定
#   ./install.sh --global                  # ~/.claude/ に skills + agents をインストール、plugins も追加
#   ./install.sh --global --add-hooks      # さらに hooks を追加
#   ./install.sh --global --add-mcp        # さらに mcp を追加
#   ./install.sh --global --add-hooks --add-mcp  # global/ 全て追加
#   ./install.sh --dry-run                 # 実行内容を確認するだけ（変更なし）
#
# インストール先（デフォルト）:
#   ./.claude/skills/  - Skills (slash commands, symlinks)
#   ./.claude/agents/  - Agents (sub-agents, symlinks)
#
# インストール先（--claude-md）:
#   ./CLAUDE.md        - テンプレートからコピー（既存は上書きしない）
#
# インストール先（--global）:
#   ~/.claude/skills/  - Skills (slash commands, symlinks)
#   ~/.claude/agents/  - Agents (sub-agents, symlinks)
#   plugins            - claude CLI 経由でインストール
#
# インストール先（--global --add-hooks）:
#   ~/.claude/hooks/   - Hook スクリプト
#
# インストール先（--global --add-mcp）:
#   ~/.claude/.mcp.json - MCP サーバー設定

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
GLOBAL=false
ADD_HOOKS=false
ADD_MCP=false
INSTALL_CLAUDE_MD=false
PROJECT_TEMPLATE="base"

# --- オプション解析 ---
for arg in "$@"; do
  case "$arg" in
    --dry-run)       DRY_RUN=true ;;
    --global)        GLOBAL=true ;;
    --add-hooks)     ADD_HOOKS=true ;;
    --add-mcp)       ADD_MCP=true ;;
    --claude-md)     INSTALL_CLAUDE_MD=true ;;
    --claude-md=*)   INSTALL_CLAUDE_MD=true; PROJECT_TEMPLATE="${arg#--claude-md=}" ;;
    --help|-h)
      sed -n '2,31p' "$0" | sed 's/^# //'
      exit 0
      ;;
  esac
done

# --- ユーティリティ ---
log()  { echo "  $*"; }
info() { echo ""; echo "==> $*"; }
run()  {
  if $DRY_RUN; then
    echo "    [dry-run] $*"
  else
    eval "$*"
  fi
}

symlink() {
  local src="$1" dst="$2"
  if [ -e "$dst" ] || [ -L "$dst" ]; then
    log "skip (already exists): $dst"
  else
    run "ln -s \"$src\" \"$dst\""
    log "linked: $dst"
  fi
}

# --- インストール先ディレクトリ ---
if $GLOBAL; then
  INSTALL_DIR="$HOME/.claude"
else
  INSTALL_DIR="$PWD/.claude"
fi

# --- Skills ---
install_skills() {
  info "Skills をインストール中..."
  run "mkdir -p \"$INSTALL_DIR/skills\""

  for skill_path in "$REPO_DIR"/project/skills/*/*; do
    [ -d "$skill_path" ] || continue
    local skill_name
    skill_name="$(basename "$skill_path")"
    symlink "$skill_path" "$INSTALL_DIR/skills/$skill_name"
  done
}

# --- Agents ---
install_agents() {
  info "Agents をインストール中..."
  run "mkdir -p \"$INSTALL_DIR/agents\""

  for agent_path in "$REPO_DIR"/project/agents/*/*; do
    [ -d "$agent_path" ] || continue
    local agent_name
    agent_name="$(basename "$agent_path")"
    symlink "$agent_path" "$INSTALL_DIR/agents/$agent_name"
  done
}

# --- Hooks ---
install_hooks() {
  info "Hooks をインストール中..."
  run "mkdir -p ~/.claude/hooks"

  local hooks_scripts_dir="$REPO_DIR/global/hooks/scripts"
  if [ ! -d "$hooks_scripts_dir" ]; then
    log "skip: global/hooks/scripts/ が見つかりません"
    return
  fi

  for script_path in "$hooks_scripts_dir"/**/*.sh "$hooks_scripts_dir"/*.sh; do
    [ -f "$script_path" ] || continue
    local script_name
    script_name="$(basename "$script_path")"
    if $DRY_RUN; then
      echo "    [dry-run] cp \"$script_path\" ~/.claude/hooks/$script_name && chmod +x ~/.claude/hooks/$script_name"
    else
      if [ -f "$HOME/.claude/hooks/$script_name" ]; then
        log "skip (already exists): ~/.claude/hooks/$script_name"
      else
        cp "$script_path" "$HOME/.claude/hooks/$script_name"
        chmod +x "$HOME/.claude/hooks/$script_name"
        log "copied: ~/.claude/hooks/$script_name"
      fi
    fi
  done
}

# --- MCP ---
install_mcp() {
  info "MCP サーバー設定をインストール中..."

  if ! command -v jq &>/dev/null; then
    echo "  [warning] jq コマンドが見つかりません。mcp のインストールをスキップします。"
    echo "            手動でインストールしてください: global/mcp/README.md を参照"
    return
  fi

  local dst="$HOME/.claude/.mcp.json"
  local mcp_dir="$REPO_DIR/global/mcp"

  for mcp_src in "$mcp_dir"/*/.mcp.json; do
    [ -f "$mcp_src" ] || continue
    local server_dir
    server_dir="$(basename "$(dirname "$mcp_src")")"

    if $DRY_RUN; then
      echo "    [dry-run] merge $server_dir entries from $mcp_src into $dst"
      continue
    fi

    # 既存ファイルがなければ空の mcpServers を作成
    if [ ! -f "$dst" ]; then
      echo '{"mcpServers":{}}' > "$dst"
    fi

    # 各エントリをマージ（既存エントリはスキップ）
    local new_entries
    new_entries="$(jq '.mcpServers' "$mcp_src")"
    local merged
    merged="$(jq --argjson new "$new_entries" \
      '.mcpServers = ($new + .mcpServers)' "$dst")"
    echo "$merged" > "$dst"
    log "merged: $server_dir entries → $dst"
  done
}

# --- Recommended Plugins ---
install_plugins() {
  info "Recommended Plugins をインストール中..."

  if ! command -v claude &>/dev/null; then
    echo "  [warning] claude コマンドが見つかりません。plugins のインストールをスキップします。"
    echo "            手動でインストールしてください: project/recommended-plugins/README.md を参照"
    return
  fi

  # 推薦 plugin リスト
  # ソース: https://github.com/anthropics/claude-plugins-official/tree/main/plugins
  local plugins=(
    "commit-commands@claude-plugins-official"
    "code-review@claude-plugins-official"
    "pr-review-toolkit@claude-plugins-official"
    "feature-dev@claude-plugins-official"
    "hookify@claude-plugins-official"
    "security-guidance@claude-plugins-official"
    "frontend-design@claude-plugins-official"
    "plugin-dev@claude-plugins-official"
  )

  for plugin in "${plugins[@]}"; do
    local plugin_name="${plugin%@*}"
    if $DRY_RUN; then
      echo "    [dry-run] claude plugin install $plugin"
    else
      echo "  installing $plugin_name ..."
      claude plugin install "$plugin" || echo "  [warning] $plugin_name のインストールに失敗しました"
    fi
  done
}

# --- CLAUDE.md ---
install_claude_md() {
  local template="$PROJECT_TEMPLATE"
  local template_src="$REPO_DIR/project/claude-md-templates/$template/CLAUDE.md"

  # テンプレートの存在確認
  if [ ! -f "$template_src" ]; then
    echo "  [error] テンプレートが見つかりません: project/claude-md-templates/$template/CLAUDE.md"
    echo "  利用可能なテンプレート:"
    for t in "$REPO_DIR"/project/claude-md-templates/*/; do
      [ -f "$t/CLAUDE.md" ] && echo "    - $(basename "$t")"
    done
    exit 1
  fi

  info "CLAUDE.md を配置中..."
  if [ -f "CLAUDE.md" ]; then
    log "skip (already exists): CLAUDE.md"
  else
    run "cp \"$template_src\" CLAUDE.md"
    log "copied: CLAUDE.md (template: $template)"
  fi
}

# --- メイン ---
echo "claude-code-tools インストーラー"
$DRY_RUN && echo "(dry-run モード: 変更は行いません)"

if $GLOBAL; then
  install_skills
  install_agents
  install_plugins
  $ADD_HOOKS && install_hooks
  $ADD_MCP   && install_mcp
else
  # 自リポジトリ内では実行不可
  if [ "$PWD" = "$REPO_DIR" ]; then
    echo "  [error] claude-code-tools リポジトリ内では実行できません。"
    echo "          プロジェクトディレクトリで実行してください。"
    echo "          グローバルインストールには --global を使用してください。"
    exit 1
  fi

  install_skills
  install_agents
  $INSTALL_CLAUDE_MD && install_claude_md
fi

echo ""
echo "完了。"
