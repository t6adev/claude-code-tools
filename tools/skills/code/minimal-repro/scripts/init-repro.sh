#!/usr/bin/env bash
# init-repro.sh — 再現環境のパターンディレクトリを一括生成・派生する
#
# Usage:
#   新規作成:
#     bash init-repro.sh <parent-dir> <pattern1> [pattern2] [pattern3] ...
#
#   既存パターンから派生（node_modules除外、依存変更前提）:
#     bash init-repro.sh <parent-dir> --from <source-pattern> <new-pattern1> [new-pattern2] ...
#
#   既存パターンを丸ごとコピー（node_modules含む）:
#     bash init-repro.sh <parent-dir> --copy <source-pattern> <new-pattern1> [new-pattern2] ...
#
# Examples:
#   bash init-repro.sh ../repro-vite-error baseline version-vite-4 no-plugin-react
#   bash init-repro.sh ../repro-vite-error --from baseline version-vite-5 version-vite-6
#   bash init-repro.sh ../repro-vite-error --copy baseline baseline-env-debug

set -euo pipefail

if [ $# -lt 2 ]; then
  echo "Usage:" >&2
  echo "  $0 <parent-dir> <pattern1> [pattern2] ..." >&2
  echo "  $0 <parent-dir> --from <source> <new-pattern1> [new-pattern2] ..." >&2
  echo "  $0 <parent-dir> --copy <source> <new-pattern1> [new-pattern2] ..." >&2
  exit 1
fi

PARENT_DIR="$1"
shift

MODE="new"
SOURCE=""

if [ "${1:-}" = "--from" ] || [ "${1:-}" = "--copy" ]; then
  MODE="$1"
  shift
  if [ $# -lt 2 ]; then
    echo "エラー: $MODE には <source-pattern> と1つ以上の <new-pattern> が必要です" >&2
    exit 1
  fi
  SOURCE="$1"
  shift
  if [ ! -d "$PARENT_DIR/$SOURCE" ]; then
    echo "エラー: コピー元のパターンが見つかりません: $PARENT_DIR/$SOURCE" >&2
    exit 1
  fi
fi

mkdir -p "$PARENT_DIR"

# --- 派生モード: 既存パターンからコピーして作成 ---
derive_from_source() {
  local src="$PARENT_DIR/$SOURCE"
  local dst="$1"
  local pattern_name="$2"

  if [ "$MODE" = "--copy" ]; then
    # 丸ごとコピー（node_modules 含む）
    cp -R "$src" "$dst"
    echo "コピー完了（全体）: $src -> $dst"
  else
    # --from: ソースファイルのみコピー（node_modules, pnpm-lock.yaml 除外）
    mkdir -p "$dst"
    for item in "$src"/*; do
      local name
      name="$(basename "$item")"
      case "$name" in
        node_modules|pnpm-lock.yaml) continue ;;
        *) cp -R "$item" "$dst/" ;;
      esac
    done
    # 隠しファイルもコピー（存在する場合）
    for item in "$src"/.*; do
      local name
      name="$(basename "$item")"
      case "$name" in
        .|..) continue ;;
        *) cp -R "$item" "$dst/" ;;
      esac
    done
    echo "派生完了（ソースファイルのみ）: $src -> $dst"
  fi

  # package.json の name フィールドを新パターン名に更新
  if [ -f "$dst/package.json" ]; then
    sed -i.bak "s/\"name\": *\"repro-[^\"]*\"/\"name\": \"repro-$pattern_name\"/" "$dst/package.json" && rm -f "$dst/package.json.bak"
  fi
}

# --- 新規作成: 雛形から生成 ---
create_new() {
  local dir="$1"
  local pattern="$2"

  mkdir -p "$dir"

  cat > "$dir/package.json" <<'PKGJSON'
{
  "name": "repro-PATTERN",
  "private": true,
  "type": "module",
  "scripts": {
    "repro": "tsx repro.ts"
  },
  "dependencies": {},
  "devDependencies": {
    "tsx": "^4.19.0",
    "typescript": "^5.7.0"
  }
}
PKGJSON
  sed -i.bak "s/PATTERN/$pattern/g" "$dir/package.json" && rm -f "$dir/package.json.bak"

  cat > "$dir/repro.ts" <<'REPRO'
// TODO: Write minimal reproduction code here
console.log("repro: PATTERN");
REPRO
  sed -i.bak "s/PATTERN/$pattern/g" "$dir/repro.ts" && rm -f "$dir/repro.ts.bak"

  cat > "$dir/README.md" <<README
# $pattern

## Purpose

<!-- What this pattern verifies -->

## Steps to Reproduce

\`\`\`bash
pnpm install
pnpm run repro
\`\`\`

## Expected Behavior

<!-- What should happen -->

## Actual Behavior

<!-- Fill in after running -->
README

  echo "作成完了: $dir"
}

# --- メイン処理 ---
for pattern in "$@"; do
  dir="$PARENT_DIR/$pattern"

  if [ -d "$dir" ]; then
    echo "警告: $dir は既に存在するためスキップします" >&2
    continue
  fi

  if [ "$MODE" = "new" ]; then
    create_new "$dir" "$pattern"
  else
    derive_from_source "$dir" "$pattern"
  fi
done

echo ""
if [ "$MODE" = "--copy" ]; then
  echo "完了。コピーしたパターンはそのまま実行できます。"
  echo "  実行: cd <pattern-dir> && pnpm run repro"
elif [ "$MODE" = "--from" ]; then
  echo "完了。派生パターンの依存を変更してください。"
  echo "  1. 各パターンの package.json を編集"
  echo "  2. 実行: cd <pattern-dir> && pnpm install && pnpm run repro"
else
  echo "完了。次のステップ:"
  echo "  1. 各パターンの package.json に依存パッケージを記載"
  echo "  2. repro.ts に最小再現コードを記述"
  echo "  3. 実行: cd <pattern-dir> && pnpm install && pnpm run repro"
fi
