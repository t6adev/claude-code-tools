# self-improvement

ユーザーからの修正・指摘を学習記録に残し、同じミスを繰り返さないための自己改善ループを定義するスキルです。

## 使い方

```
/self-improvement
```

引数は不要です。修正を受けた直後、またはセッション開始時に呼び出します。

## いつ使うか

- ユーザーから「違う」「そうじゃない」「前にも言ったけど」といった修正を受けた時
- 同じミスを繰り返していると気づいた時
- セッション開始時（過去の教訓を確認するため）

## 動作

1. **記録**: `tasks/lessons.md` に状況・原因・ルールの形式でミスを記録
2. **確認**: セッション開始時に既存の教訓を確認し、現在のタスクへ適用
3. **統合**: 教訓が蓄積されたらパターンを整理し、必要に応じて CLAUDE.md へ昇格

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/skills/meta/self-improvement ~/.claude/skills/self-improvement

# プロジェクト（コピー）
cp -r ~/path/to/claude-code-tools/skills/meta/self-improvement .claude/skills/
```
