macOS では osascript が標準搭載されているため追加インストールは不要です。

### macOS: 初回通知の有効化

macOS では通知を初めて送る前に、Script Editor で一度手動実行して通知の許可を得る必要があります。

1. **Script Editor** を開く（Spotlight で「Script Editor」と検索）
2. 新規スクリプトに以下を入力して実行（▶ ボタン）:
   ```
   display notification "Hi all"
   ```
3. 通知の許可ダイアログが表示されたら「許可」を選択
4. 以降、osascript による通知が正常に動作します

Linux では libnotify をインストールしてください:
Ubuntu: sudo apt install libnotify-bin
