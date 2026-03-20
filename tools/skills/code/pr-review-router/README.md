# pr-review-router

レビュー意図を解析し、`code-review` と `pr-review-toolkit` のどちらを使うべきかをルーティングするスキルです。

## 使い方

```
/pr-review-router [任意: レビュー意図や懸念点]
```

引数は省略できます。省略した場合は直前の会話文脈からレビュー意図を読み取ります。

## ルーティング基準

| シグナル | ルーティング先 | エージェント |
|---|---|---|
| 「ざっと見て」「全体確認」「PR 作成前チェック」| `code-review` | `/code-review:review`（5並列） |
| 「型」「型設計」「型安全」 | `pr-review-toolkit` | `type-design-analyzer` |
| 「エラーハンドリング」「サイレント失敗」「例外握りつぶし」 | `pr-review-toolkit` | `silent-failure-hunter` |
| 「テスト品質」「カバレッジ」「テストが足りない」 | `pr-review-toolkit` | `pr-test-analyzer` |
| 「コメント」「ドキュメント不足」 | `pr-review-toolkit` | `comment-analyzer` |
| 「複雑すぎる」「シンプルにしたい」 | `pr-review-toolkit` | `code-simplifier` |
| 不明 | 1問質問してからルーティング | — |

## 動作

1. 引数または会話文脈からレビューのシグナルを読み取る
2. シグナルテーブルに照合してツールとエージェントを決定する
3. ツール名・理由・実行コマンドを提示する（直接起動はしない）
4. シグナルが読み取れない場合は1問だけ質問する

## 前提

以下のプラグインがインストール済みであること:
- `code-review` (`recommended-plugins/code-review/`)
- `pr-review-toolkit` (`recommended-plugins/pr-review-toolkit/`)

## インストール

```bash
REPO=~/path/to/claude-code-tools

# グローバル（全プロジェクトで利用可能）
ln -s "$REPO/skills/code/pr-review-router" ~/.claude/skills/pr-review-router

# プロジェクトローカル
cp -r "$REPO/skills/code/pr-review-router" .claude/skills/
```
