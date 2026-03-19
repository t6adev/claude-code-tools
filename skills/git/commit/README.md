# commit

ステージ済みの変更から [Conventional Commits](https://www.conventionalcommits.org/) 形式のコミットメッセージを生成し、コミットします。

## 使い方

```
/commit [scope]
```

## 例

```bash
# スコープなし（変更から推測）
/commit

# スコープ指定
/commit auth
/commit api
/commit ui
```

## 出力例

```
feat(auth): add JWT refresh token support

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

## 動作

1. `git diff --staged` でステージ済み変更を確認
2. 変更の性質から `type` を判断（feat / fix / docs / refactor / test / chore）
3. Conventional Commits 形式でコミットメッセージを生成
4. `git commit` でコミットを作成

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/skills/git/commit ~/.claude/skills/commit

# プロジェクト（コピー）
cp -r ~/path/to/claude-code-tools/skills/git/commit .claude/skills/
```
