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

| ディレクトリ | イベント |
|---|---|
| `pre-tool/` | `PreToolUse`（ツール実行前） |
| `post-tool/` | `PostToolUse` / `Stop` |

## スクリプトの要件

- `#!/usr/bin/env bash` で始める
- `set -euo pipefail` を先頭に置く
- stdin から `jq` で tool_input を読む
- 終了コード: `0`=許可、`1`=警告、`2`=強制ブロック（PreToolUse のみ）
- 実行権限を付与する（`chmod +x`）

## 追加後の手順

1. `chmod +x <script-name>.sh` で実行権限を付与する
2. `tools/hooks/scripts/<event>/README.md` のテーブルに追記する
3. 設定スニペットが必要なら `tools/hooks/configs/<name>.json` を追加する
4. PR を作成する（[pr-checklist.md](pr-checklist.md) 参照）
