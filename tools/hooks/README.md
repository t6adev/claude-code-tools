# Hooks

Claude Code のライフサイクルフックの定義です。

## Hook セット一覧

| セット名             | 説明                                                          |
| -------------------- | ------------------------------------------------------------- |
| `safety-rails`       | `rm -rf /` など危険な削除コマンドをブロック                   |
| `notify-on-stop`     | 応答完了時・許可要求時にデスクトップ通知を送る                |
| `block-secret-files` | `.env` や秘密鍵など秘密情報を含むファイルの読み込みをブロック |

## 使い方

インストーラー（`npx github:t6adev/claude-code-tools`）を使うとインタラクティブに選択してインストールできます。

手動でインストールする場合:

```bash
REPO=~/path/to/claude-code-tools
INSTALL_DIR=~/.claude  # ローカルインストールの場合は /path/to/project/.claude

# スクリプトをコピー
cp "$REPO/tools/hooks/safety-rails/block-dangerous-rm.sh" "$INSTALL_DIR/hooks/"
chmod +x "$INSTALL_DIR/hooks/block-dangerous-rm.sh"

# settings.json に Hook 設定をマージ
# safety-rails.json の "hooks" セクションを $INSTALL_DIR/settings.json に追記し、
# command パスを実際のインストール先（$INSTALL_DIR/hooks/...）に書き換える
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

## 新しい Hook セットを追加する

1. `hooks/<set-name>/` ディレクトリを作成する
2. スクリプト（`.sh`）と Hook 設定（`.json`、`"hooks"` キーを含む）を配置する
3. 必要に応じて `POST_INSTALL.md` を追加する（インストール後にターミナルへ表示される）

[`docs/hook-authoring-guide.md`](../../docs/hook-authoring-guide.md) も参照してください。
