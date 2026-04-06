#!/usr/bin/env bash
# sync-repro.sh — あるパターンの変更を他のパターンに横展開する
#
# Usage:
#   特定ファイルを横展開:
#     bash sync-repro.sh <parent-dir> <source-pattern> <file1> [file2] ... -- <target1> [target2] ...
#
#   特定ファイルを全パターンに横展開（-- なしで source 以外の全ディレクトリが対象）:
#     bash sync-repro.sh <parent-dir> <source-pattern> <file1> [file2] ...
#
#   新規追加ファイルを自動検出して横展開（--new）:
#     bash sync-repro.sh <parent-dir> --new <source-pattern> -- <target1> [target2] ...
#     bash sync-repro.sh <parent-dir> --new <source-pattern>
#
# Examples:
#   bash sync-repro.sh ../repro-issue baseline test.ts -- version-a version-b
#   bash sync-repro.sh ../repro-issue baseline test.ts vitest.config.ts
#   bash sync-repro.sh ../repro-issue --new baseline
#
# Notes:
#   - package.json と pnpm-lock.yaml は横展開対象外（--force で上書き可能）
#   - 対象ファイルが既に存在する場合は差分を表示して確認を求める

set -euo pipefail

usage() {
  echo "使い方:" >&2
  echo "  $0 <parent-dir> <source> <file1> [file2] ... [-- <target1> ...]" >&2
  echo "  $0 <parent-dir> --new <source> [-- <target1> ...]" >&2
  echo "  --force を追加すると package.json 等も横展開対象にする" >&2
  exit 1
}

if [ $# -lt 2 ]; then
  usage
fi

PARENT_DIR="$1"
shift

FORCE=false
if [ "${1:-}" = "--force" ]; then
  FORCE=true
  shift
fi

# package.json 等を横展開対象外にするフィルタ
SKIP_FILES=("package.json" "pnpm-lock.yaml" "node_modules")

should_skip() {
  local file="$1"
  if [ "$FORCE" = true ]; then
    return 1
  fi
  for skip in "${SKIP_FILES[@]}"; do
    if [ "$file" = "$skip" ] || [[ "$file" == "$skip"/* ]]; then
      return 0
    fi
  done
  return 1
}

# --new モード: ソースにあって他にないファイルを自動検出
if [ "${1:-}" = "--new" ]; then
  shift
  if [ $# -lt 1 ]; then
    usage
  fi
  SOURCE="$1"
  shift

  SOURCE_DIR="$PARENT_DIR/$SOURCE"
  if [ ! -d "$SOURCE_DIR" ]; then
    echo "エラー: コピー元が見つかりません: $SOURCE_DIR" >&2
    exit 1
  fi

  # ターゲットの解析（-- 以降、または全パターン）
  TARGETS=()
  if [ "${1:-}" = "--" ]; then
    shift
    TARGETS=("$@")
  else
    for d in "$PARENT_DIR"/*/; do
      name="$(basename "$d")"
      if [ "$name" != "$SOURCE" ]; then
        TARGETS+=("$name")
      fi
    done
  fi

  if [ ${#TARGETS[@]} -eq 0 ]; then
    echo "エラー: 横展開先のパターンが見つかりません" >&2
    exit 1
  fi

  # ソースのファイル一覧を取得（node_modules 除外）
  NEW_FILES=()
  while IFS= read -r file; do
    rel="${file#"$SOURCE_DIR"/}"
    if should_skip "$rel"; then
      continue
    fi
    # 1つでもターゲットにないファイルがあれば対象
    for target in "${TARGETS[@]}"; do
      if [ ! -e "$PARENT_DIR/$target/$rel" ]; then
        NEW_FILES+=("$rel")
        break
      fi
    done
  done < <(find "$SOURCE_DIR" -type f -not -path "*/node_modules/*")

  if [ ${#NEW_FILES[@]} -eq 0 ]; then
    echo "横展開対象の新規ファイルはありません"
    exit 0
  fi

  # 重複除去（macOS の bash 3.x 互換）
  deduped="$(printf '%s\n' "${NEW_FILES[@]}" | sort -u)"
  NEW_FILES=()
  while IFS= read -r line; do
    [ -n "$line" ] && NEW_FILES+=("$line")
  done <<< "$deduped"

  echo "検出された新規ファイル:"
  for f in "${NEW_FILES[@]}"; do
    echo "  $f"
  done
  echo ""

  for target in "${TARGETS[@]}"; do
    TARGET_DIR="$PARENT_DIR/$target"
    if [ ! -d "$TARGET_DIR" ]; then
      echo "警告: $TARGET_DIR が見つかりません、スキップします" >&2
      continue
    fi
    for file in "${NEW_FILES[@]}"; do
      src="$SOURCE_DIR/$file"
      dst="$TARGET_DIR/$file"
      mkdir -p "$(dirname "$dst")"
      cp "$src" "$dst"
      echo "  $SOURCE/$file -> $target/$file"
    done
  done

  echo ""
  echo "横展開完了（${#NEW_FILES[@]} ファイル x ${#TARGETS[@]} パターン）"
  exit 0
fi

# 通常モード: 指定ファイルを横展開
SOURCE="$1"
shift

SOURCE_DIR="$PARENT_DIR/$SOURCE"
if [ ! -d "$SOURCE_DIR" ]; then
  echo "エラー: コピー元が見つかりません: $SOURCE_DIR" >&2
  exit 1
fi

# ファイルとターゲットを -- で分割
FILES=()
TARGETS=()
READING_TARGETS=false

for arg in "$@"; do
  if [ "$arg" = "--" ]; then
    READING_TARGETS=true
    continue
  fi
  if [ "$READING_TARGETS" = true ]; then
    TARGETS+=("$arg")
  else
    FILES+=("$arg")
  fi
done

if [ ${#FILES[@]} -eq 0 ]; then
  echo "エラー: 横展開するファイルを指定してください" >&2
  usage
fi

# ターゲット未指定の場合はソース以外の全パターン
if [ ${#TARGETS[@]} -eq 0 ]; then
  for d in "$PARENT_DIR"/*/; do
    name="$(basename "$d")"
    if [ "$name" != "$SOURCE" ]; then
      TARGETS+=("$name")
    fi
  done
fi

if [ ${#TARGETS[@]} -eq 0 ]; then
  echo "エラー: 横展開先のパターンが見つかりません" >&2
  exit 1
fi

# スキップ対象のチェック
SKIPPED=()
VALID_FILES=()
for file in "${FILES[@]}"; do
  if should_skip "$file"; then
    SKIPPED+=("$file")
  else
    VALID_FILES+=("$file")
  fi
done

if [ ${#SKIPPED[@]} -gt 0 ]; then
  echo "以下のファイルは横展開対象外です（--force で上書き可能）:"
  for f in "${SKIPPED[@]}"; do
    echo "  スキップ: $f"
  done
  echo ""
fi

if [ ${#VALID_FILES[@]} -eq 0 ]; then
  echo "横展開するファイルがありません"
  exit 0
fi

# 横展開の実行
SYNCED=0
for target in "${TARGETS[@]}"; do
  TARGET_DIR="$PARENT_DIR/$target"
  if [ ! -d "$TARGET_DIR" ]; then
    echo "警告: $TARGET_DIR が見つかりません、スキップします" >&2
    continue
  fi
  for file in "${VALID_FILES[@]}"; do
    src="$SOURCE_DIR/$file"
    dst="$TARGET_DIR/$file"

    if [ ! -e "$src" ]; then
      echo "警告: $src が見つかりません、スキップします" >&2
      continue
    fi

    mkdir -p "$(dirname "$dst")"

    if [ -e "$dst" ]; then
      if diff -q "$src" "$dst" > /dev/null 2>&1; then
        echo "  同一: $target/$file"
        continue
      fi
      echo "  上書き: $target/$file"
    else
      echo "  追加: $target/$file"
    fi

    cp "$src" "$dst"
    SYNCED=$((SYNCED + 1))
  done
done

echo ""
echo "横展開完了（${SYNCED} ファイル更新）"
