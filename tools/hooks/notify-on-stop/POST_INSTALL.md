各スクリプトに実行権限を付与してください:

chmod +x <INSTALL_DIR>/hooks/notify-on-stop.sh
chmod +x <INSTALL_DIR>/hooks/notify-on-permission.sh

macOS では osascript が標準搭載されているため追加インストールは不要です。
Linux では libnotify をインストールしてください:
Ubuntu: sudo apt install libnotify-bin
