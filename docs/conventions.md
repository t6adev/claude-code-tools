# 命名規則

## ファイル・ディレクトリ名

- `lowercase-with-hyphens` を使う（アンダースコア不使用）

## Skill

- スキル名 = スラッシュコマンド名 = ディレクトリ名

```
tools/skills/git/commit/     ← ディレクトリ名 "commit"
                └── SKILL.md   ← name: commit
```

## Agent

- エージェント定義ファイル名 = ディレクトリ名 + `.md`

```
tools/agents/review/code-reviewer/     ← ディレクトリ名 "code-reviewer"
                       └── code-reviewer.md   ← ファイル名もディレクトリ名と一致
```
