# sandbox-check

Claude Code の sandbox 設定と開発プロジェクトの環境適合性を事前にチェックするスキル。

## 何をするか

sandbox を有効にした開発環境で、テスト・ビルド・リント等のコマンドが sandbox のネットワーク制約やファイルシステム制約によって失敗しないかを事前に検証し、レポートする。

## 使い方

```
/sandbox-check
```

## チェック内容

1. **sandbox 設定の収集** — `~/.claude/settings.json` やプロジェクトの `.claude/settings.json` から現在の sandbox 設定を読み取る
2. **開発フローの特定** — `package.json` のスクリプト、`CLAUDE.md`、テスト設定、MCP 設定等からエージェントが実行するコマンドを収集
3. **ユーザーへのヒアリング** — 追加の開発フローがないか確認
4. **互換性チェック** — ネットワークホスト、ファイルシステムパス、ツール許可の3軸で検証
5. **レポート出力** — 問題点と推奨アクション（settings.json の修正案）を提示

## インストール

```bash
REPO=~/path/to/claude-code-tools

# グローバルインストール
ln -s "$REPO/tools/skills/infra/sandbox-check" ~/.claude/skills/sandbox-check
```
