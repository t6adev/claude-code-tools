---
name: commit
description: Generate a conventional commit message for staged git changes and create the commit
allowed-tools: Bash, Read
argument-hint: "[scope]"
---

ステージ済みの変更を確認し、[Conventional Commits](https://www.conventionalcommits.org/) 形式でコミットを作成してください。

## 手順

1. `git diff --staged` で変更内容を確認する
2. 変更の性質を判断し、適切な type を選ぶ:
   - `feat`: 新機能
   - `fix`: バグ修正
   - `docs`: ドキュメントのみの変更
   - `refactor`: バグ修正・機能追加を伴わないコード変更
   - `test`: テストの追加・修正
   - `chore`: ビルドプロセス・補助ツールの変更
   - `perf`: パフォーマンス改善
3. コミットメッセージを作成する:
   - 形式: `<type>(<scope>): <description>`
   - `<scope>` は引数 `$ARGUMENTS` があればそれを使う。なければ変更から推測する
   - `<description>` は英語で50文字以内、命令形（"add" not "added"）
4. `git commit` で以下の形式でコミットする:

```
git commit -m "$(cat <<'EOF'
<type>(<scope>): <description>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

5. コミットハッシュとメッセージを表示する

## 注意

- ステージされていない変更は対象外
- `.env` や認証情報を含むファイルが含まれていれば警告する
- 破壊的変更がある場合は `BREAKING CHANGE:` フッターを追加する
