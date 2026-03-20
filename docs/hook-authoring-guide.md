# Hook スクリプト作成ガイド

## ファイル構成

```
tools/hooks/scripts/<event-type>/
├── <script-name>.sh    # 実行スクリプト（必須）
└── README.md           # スクリプト一覧（更新する）

tools/hooks/configs/
└── <preset-name>.json  # settings.json スニペット（任意）
```

## イベントタイプ

| ディレクトリ | イベント                     |
| ------------ | ---------------------------- |
| `pre-tool/`  | `PreToolUse`（ツール実行前） |
| `post-tool/` | `PostToolUse` / `Stop`       |

## スクリプトの要件

- `#!/usr/bin/env bash` で始める
- `set -euo pipefail` を先頭に置く
- stdin から `jq` で tool_input を読む
- 終了コード: `0`=許可、`1`=警告、`2`=強制ブロック（PreToolUse のみ）
- 実行権限を付与する（`chmod +x`）

## plugin-dev を活用する

[`plugin-dev`](../tools/recommended-plugins/plugin-dev/) プラグインをインストールすると、Hook 開発を AI がガイドしてくれます。

```
# Hook 作成の相談
「PreToolUse フックでファイル書き込みを検証したい」
→ plugin-dev の hook-development スキルが自動でロードされる
```

`hook-development` スキルが提供するもの:

- Prompt-based hooks（LLM による判断）と Command hooks（確定的な検証）の使い分け
- 全イベントタイプのリファレンス（PreToolUse, PostToolUse, Stop, SessionStart など）
- `validate-hook-schema.sh`・`test-hook.sh`・`hook-linter.sh` の検証ユーティリティ
- `${CLAUDE_PLUGIN_ROOT}` を使ったポータブルなパス設計

## 追加後の手順

1. `chmod +x <script-name>.sh` で実行権限を付与する
2. `tools/hooks/scripts/<event>/README.md` のテーブルに追記する
3. 設定スニペットが必要なら `tools/hooks/configs/<name>.json` を追加する
4. PR を作成する（[pr-checklist.md](pr-checklist.md) 参照）
