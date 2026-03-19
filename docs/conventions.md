# 命名規則

## ファイル・ディレクトリ名

- `lowercase-with-hyphens` を使う（アンダースコア不使用）

## Skill

- スキル名 = スラッシュコマンド名 = ディレクトリ名

```
project/skills/git/commit/     ← ディレクトリ名 "commit"
                └── SKILL.md   ← name: commit
```

## Agent

- エージェント定義ファイル名 = ディレクトリ名 + `.md`

```
project/agents/review/code-reviewer/     ← ディレクトリ名 "code-reviewer"
                       └── code-reviewer.md   ← ファイル名もディレクトリ名と一致
```
