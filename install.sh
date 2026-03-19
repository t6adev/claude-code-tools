#!/usr/bin/env bash
# install.sh - claude-code-tools インストーラー
#
# 使い方:
#   ./install.sh                           # 全てグローバルインストール
#   ./install.sh --project                 # プロジェクトへの導入（base テンプレート）
#   ./install.sh --project=typescript-node # テンプレート指定
#   ./install.sh --dry-run                 # 実行内容を確認するだけ（変更なし）
#   ./install.sh --no-plugins              # plugins をスキップ
#   ./install.sh --no-skills --no-agents   # plugins のみ更新
#
# インストール先（グローバル）:
#   ~/.claude/skills/   - Skills (slash commands)
#   ~/.claude/agents/   - Agents (sub-agents)
#   plugins             - claude CLI 経由でインストール
#
# インストール先（--project）:
#   ./.claude/skills/   - Skills (symlinks)
#   ./.claude/agents/   - Agents (symlinks)
#   ./CLAUDE.md         - テンプレートからコピー（既存は上書きしない）

set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DRY_RUN=false
SKIP_PLUGINS=false
SKIP_SKILLS=false
SKIP_AGENTS=false
INSTALL_PROJECT=false
PROJECT_TEMPLATE="base"

# --- オプション解析 ---
for arg in "$@"; do
  case "$arg" in
    --dry-run)      DRY_RUN=true ;;
    --no-plugins)   SKIP_PLUGINS=true ;;
    --no-skills)    SKIP_SKILLS=true ;;
    --no-agents)    SKIP_AGENTS=true ;;
    --project)      INSTALL_PROJECT=true ;;
    --project=*)    INSTALL_PROJECT=true; PROJECT_TEMPLATE="${arg#--project=}" ;;
    --help|-h)
      sed -n '2,20p' "$0" | sed 's/^# //'
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
  # ソース: https://github.com/anthropics/claude-code/tree/main/plugins
  local plugins=(
    "commit-commands@official"
    "code-review@official"
    "pr-review-toolkit@official"
    "feature-dev@official"
    "hookify@official"
    "security-guidance@official"
    "frontend-design@official"
    "plugin-dev@official"
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

# --- Project インストール ---
install_project() {
  local template="$PROJECT_TEMPLATE"
  local template_src="$REPO_DIR/templates/$template/CLAUDE.md"

  info "プロジェクトへの導入 (template: $template)..."

  # 自分自身のリポジトリ内では実行不可
  if [ "$PWD" = "$REPO_DIR" ]; then
    echo "  [error] claude-code-tools リポジトリ内では実行できません。"
    echo "          プロジェクトディレクトリで実行してください。"
    exit 1
  fi

  # テンプレートの存在確認
  if [ ! -f "$template_src" ]; then
    echo "  [error] テンプレートが見つかりません: templates/$template/CLAUDE.md"
    echo "  利用可能なテンプレート:"
    for t in "$REPO_DIR"/templates/*/; do
      [ -f "$t/CLAUDE.md" ] && echo "    - $(basename "$t")"
    done
    exit 1
  fi

  # .claude/skills/ にシンボリックリンク
  info "Skills をリンク中..."
  run "mkdir -p .claude/skills"
  for skill_path in "$REPO_DIR"/skills/*/*; do
    [ -d "$skill_path" ] || continue
    local skill_name
    skill_name="$(basename "$skill_path")"
    symlink "$skill_path" "$PWD/.claude/skills/$skill_name"
  done

  # .claude/agents/ にシンボリックリンク
  info "Agents をリンク中..."
  run "mkdir -p .claude/agents"
  for agent_path in "$REPO_DIR"/agents/*/*; do
    [ -d "$agent_path" ] || continue
    local agent_name
    agent_name="$(basename "$agent_path")"
    symlink "$agent_path" "$PWD/.claude/agents/$agent_name"
  done

  # CLAUDE.md をコピー（既存は上書きしない）
  info "CLAUDE.md を配置中..."
  if [ -f "CLAUDE.md" ]; then
    log "skip (already exists): CLAUDE.md"
  else
    run "cp \"$template_src\" CLAUDE.md"
    log "copied: CLAUDE.md (template: $template)"
  fi

  echo ""
  echo "  完了。次のステップ:"
  echo "    1. CLAUDE.md をプロジェクト固有の情報で編集してください"
  echo "    2. アップデート: cd $REPO_DIR && git pull"
}

# --- メイン ---
echo "claude-code-tools インストーラー"
$DRY_RUN && echo "(dry-run モード: 変更は行いません)"

if $INSTALL_PROJECT; then
  install_project
else
  $SKIP_SKILLS  || install_skills
  $SKIP_AGENTS  || install_agents
  $SKIP_PLUGINS || install_plugins
fi

echo ""
echo "完了。"
