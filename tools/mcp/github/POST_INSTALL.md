GITHUB_TOKEN 環境変数を設定してください:

1. https://github.com/settings/tokens で Personal Access Token を作成
   必要なスコープ: repo, read:org（書き込みが必要な場合は write:org も）
2. シェルプロファイル（~/.zshrc 等）に追加:
   export GITHUB_TOKEN=ghp_xxxxxxxxxxxx
3. 設定を反映:
   source ~/.zshrc
