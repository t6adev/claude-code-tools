notify-on-stop.sh に実行権限を付与してください:

chmod +x ~/.claude/hooks/notify-on-stop.sh

macOS では osascript が標準搭載されているため追加インストールは不要です。
Linux では libnotify をインストールしてください:
Ubuntu: sudo apt install libnotify-bin
