# Hooks

Claude Code のライフサイクルフックの定義です。

## 構成

```
hooks/
├── scripts/        実行スクリプト（hookから呼ばれる）
│   ├── pre-tool/   PreToolUse イベント用
│   └── post-tool/  PostToolUse イベント用
└── configs/        settings.json にマージできる JSON スニペット
```

## 使い方

### 1. スクリプトをインストールする

```bash
REPO=~/path/to/claude-code-tools

# スクリプトをコピー（または参照パスをそのまま使う）
cp "$REPO/hooks/scripts/pre-tool/block-dangerous-rm.sh" ~/.claude/hooks/
chmod +x ~/.claude/hooks/block-dangerous-rm.sh
```

### 2. settings.json に Hook 設定を追加する

`hooks/configs/` 内の JSON スニペットを参考に `~/.claude/settings.json` へ追記します。

または、configs/ 内のファイルを丸ごとコピーして出発点にします:

```bash
cp "$REPO/hooks/configs/safety-rails.json" ~/.claude/settings.json
```

## Hook イベント一覧

| イベント       | タイミング                   |
| -------------- | ---------------------------- |
| `PreToolUse`   | ツール実行前（ブロック可能） |
| `PostToolUse`  | ツール実行後                 |
| `SessionStart` | セッション開始時             |
| `Stop`         | Claude の応答終了時          |

## 終了コードの意味（PreToolUse）

| コード | 意味                                              |
| ------ | ------------------------------------------------- |
| `0`    | 許可（続行）                                      |
| `1`    | ブロック（stdout のメッセージを Claude に渡す）   |
| `2`    | 強制ブロック（stdout を無視してツール実行を中断） |

## 新しいスクリプトを追加する

[`docs/hook-authoring-guide.md`](../../docs/hook-authoring-guide.md) を参照してください。
