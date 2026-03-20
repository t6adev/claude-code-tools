# Skill 作成ガイド

## ファイル構成

```
tools/skills/<category>/<skill-name>/
├── SKILL.md    # 機械可読な定義（必須）
└── README.md   # 人間向けドキュメント（必須）
```

## カテゴリ一覧

| カテゴリ | 用途 |
|---|---|
| `git/` | git 操作・コミット・PR 関連 |
| `code/` | コード編集・リファクタリング・説明 |
| `docs/` | ドキュメント生成・更新 |
| `infra/` | インフラ・デプロイ関連 |
| `meta/` | claude-code-tools 自体の操作 |

カテゴリが増える場合はこのファイルも更新してください。

## README.md の書き方

```markdown
# <skill-name>

<1〜2行の概要>

## 使い方

/<skill-name> [引数]

## 例

/<skill-name> feat

## 動作

<スキルが何をするかの説明>
```

## SKILL.md フォーマット

```markdown
---
name: <skill-name>
description: <Claude がいつこのスキルを使うかの説明（英語）>
allowed-tools: Bash, Read, Edit
argument-hint: "[optional-arg]"
---

プロンプト本文
```

## フロントマター フィールド

| フィールド | 必須 | 説明 |
|---|---|---|
| `name` | 必須 | スラッシュコマンド名。ディレクトリ名と一致させる |
| `description` | 必須 | Claude がこのスキルを自動選択する際の判断基準。英語で書く |
| `allowed-tools` | 推奨 | 使用を許可するツールをカンマ区切りで指定 |
| `argument-hint` | 任意 | `/skill-name` のあとに続く引数の説明（ヘルプ表示用） |
| `disable-model-invocation` | 任意 | `true` にすると手動呼び出し専用になる |
| `user-invocable` | 任意 | `false` にすると `/` メニューに表示されない |

## 引数の参照

| 記法 | 意味 |
|---|---|
| `$ARGUMENTS` | 全引数（スペース区切り） |
| `$0`, `$1`, `$2` | 位置引数 |
| `${CLAUDE_SKILL_DIR}` | このスキルのディレクトリパス |

## 良い `description` の書き方

`description` は Claude がスキルを自動選択する際の判断基準になります。

**良い例:**
```
Generate a conventional commit message for staged git changes
```

**悪い例（曖昧すぎる）:**
```
Help with git
```

- 動詞で始める（Generate, Review, Analyze, Create）
- スキルが何をする（action）のかを明確に
- どんな文脈で使うか（context）を含める
- 英語で書く（Claude の判断に使われるため）

## プロンプト本文の書き方

- 指示は番号付きリストで明確に書く
- 引数 `$ARGUMENTS` の使われ方を示す
- Claude が迷わないよう、前提条件・出力形式を具体的に書く

### 例（commit スキル）

```markdown
---
name: commit
description: Generate a conventional commit message for staged git changes and create the commit
allowed-tools: Bash, Read
argument-hint: "[scope]"
---

ステージ済みの変更を確認し、Conventional Commits 形式でコミットを作成してください。

1. `git diff --staged` で変更内容を確認する
2. 変更の性質を判断する（feat / fix / docs / refactor / test / chore など）
3. コミットメッセージを生成する: `<type>(<scope>): <description>`
   - scope は引数 $ARGUMENTS があればそれを使う
   - 50文字以内で簡潔に
4. `git commit -m` でコミットを作成する
5. コミットハッシュとメッセージを表示する

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com> をメッセージに含める。
```

## plugin-dev を活用する

[`plugin-dev`](../tools/recommended-plugins/plugin-dev/) プラグインをインストールすると、Skill 作成を AI がガイドしてくれます。

```
# Skill 作成の相談
「新しいスキルを追加したい。description の書き方を教えて」
→ plugin-dev の skill-development スキルが自動でロードされる
```

`skill-development` スキルが提供するもの:
- Progressive Disclosure パターン（メタデータ → SKILL.md → リソース）の実践方法
- 強いトリガーフレーズの書き方
- `skill-creator` メソドロジーに基づいたワークフロー

## ミニマムチェックリスト

- [ ] `name` がディレクトリ名と一致している
- [ ] `description` が英語で動詞始まりになっている
- [ ] `allowed-tools` が必要最小限に絞られている
- [ ] README.md が添付されている
- [ ] `tools/skills/README.md` のテーブルに追記している

詳細は [pr-checklist.md](pr-checklist.md) を参照。
