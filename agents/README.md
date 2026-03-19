# Agents

サブエージェントの一覧です。

## testing

| エージェント | 説明 |
|---|---|
| [test-writer](testing/test-writer/) | 既存コードを分析し包括的なテストを生成 |

## インストール方法

各エージェントの `README.md` を参照してください。

グローバルへのインストール（全プロジェクトで利用可能）:
```bash
REPO=~/path/to/claude-code-tools

ln -s "$REPO/agents/testing/test-writer" ~/.claude/agents/test-writer
```

## 新しいエージェントを追加する

[`docs/contributing.md`](../docs/contributing.md) を参照してください。
