#!/usr/bin/env bash
# install.sh - claude-code-tools グローバルインストーラー
#
# 使い方:
#   ./install.sh              # 全てインストール
#   ./install.sh --dry-run    # 実行内容を確認するだけ（変更なし）
#   ./install.sh --no-plugins # plugins をスキップ
#
# インストール先:
#   ~/.claude/skills/   - Skills (slash commands)
#   ~/.claude/agents/   - Agents (sub-agents)
#   plugins             - claude CLI 経由でインストール

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
SKIP_PLUGINS=false

# --- オプション解析 ---
for arg in "$@"; do
  case "$arg" in
    --dry-run)     DRY_RUN=true ;;
    --no-plugins)  SKIP_PLUGINS=true ;;
    --help|-h)
      sed -n '2,8p' "$0" | sed 's/^# //'
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

# --- Skills ---
install_skills() {
  info "Skills をインストール中..."
  mkdir -p ~/.claude/skills

  for skill_path in "$REPO_DIR"/skills/*/*; do
    [ -d "$skill_path" ] || continue
    local skill_name
    skill_name="$(basename "$skill_path")"
    symlink "$skill_path" "$HOME/.claude/skills/$skill_name"
  done
}

# --- Agents ---
install_agents() {
  info "Agents をインストール中..."
  mkdir -p ~/.claude/agents

  for agent_path in "$REPO_DIR"/agents/*/*; do
    [ -d "$agent_path" ] || continue
    local agent_name
    agent_name="$(basename "$agent_path")"
    symlink "$agent_path" "$HOME/.claude/agents/$agent_name"
  done
}

# --- Recommended Plugins ---
install_plugins() {
  info "Recommended Plugins をインストール中..."

  if ! command -v claude &>/dev/null; then
    echo "  [warning] claude コマンドが見つかりません。plugins のインストールをスキップします。"
    echo "            手動でインストールしてください: recommended-plugins/README.md を参照"
    return
  fi

  # 推薦 plugin リスト
  # 形式: "plugin-name@registry"
  local plugins=(
    "commit-commands@official"
    "code-review@official"
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

# --- メイン ---
echo "claude-code-tools インストーラー"
$DRY_RUN && echo "(dry-run モード: 変更は行いません)"

install_skills
install_agents
$SKIP_PLUGINS || install_plugins

echo ""
echo "完了。"
