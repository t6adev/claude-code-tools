---
name: sandbox-check
description: This skill should be used when the user asks to "sandboxの互換性をチェックして", "sandbox設定を確認して", "このプロジェクトでsandboxが使えるか調べて", "check sandbox compatibility", "verify sandbox settings", or wants to ensure their development workflow works within Claude Code's sandbox restrictions before starting work.
argument-hint: "(no args = auto-detect from project files)"
allowed-tools: Bash, Read, Glob, Grep
---

Claude Code の sandbox 設定と開発プロジェクトの環境が適合しているかを事前にチェックし、エージェントが開発フロー中に sandbox 制約で失敗することを防ぐスキル。

## 目的

sandbox を有効にした状態で開発を行う場合、ネットワーク制約やファイルシステム制約により、テスト・ビルド・リント等のコマンドが意図せず失敗することがある。このスキルはそれを事前に検出してレポートする。

---

## Phase 1: Sandbox 設定の収集

以下のファイルを順に読み取り、現在の sandbox 設定を把握する。

1. `~/.claude/settings.json` — グローバル設定
2. `.claude/settings.json` — プロジェクト設定
3. `.claude/settings.local.json` — ローカルオーバーライド

各ファイルから以下を抽出する:

- `sandbox.enabled` — sandbox が有効か
- `sandbox.network.allowedDomains`（または `allowedHosts`）— 許可されたネットワークホスト
- `sandbox.filesystem.allowWrite`（または `filesystem.write.allowOnly`）— 書き込み許可パス
- `sandbox.autoAllowBashIfSandboxed` — Bash 自動許可設定
- `permissions.allow` — 許可済みツールパターン

sandbox が無効、または設定が見つからない場合はその旨をレポートして終了する。

**重要**: 設定はマージされる。グローバル設定とプロジェクト設定の両方を統合して判断する。

---

## Phase 2: 開発フローの収集

プロジェクトが必要とする開発フロー（エージェントが実行するであろう操作）を以下のソースから収集する。

### 2a: プロジェクトファイルからの自動収集

以下のファイルを読み取り、エージェントが実行する可能性のあるコマンド・アクセス先を特定する。

| ソース                                                                          | 抽出対象                                        |
| ------------------------------------------------------------------------------- | ----------------------------------------------- |
| `package.json` の `scripts`                                                     | テスト・ビルド・リント等のコマンド              |
| `CLAUDE.md`                                                                     | 開発ワークフロー指示、実行すべきコマンド        |
| `README.md`                                                                     | セットアップ手順、開発コマンド                  |
| `.claude/settings.json` の MCP サーバー設定                                     | MCP サーバーが必要とするネットワークアクセス    |
| テスト設定ファイル（`vitest.config.*`, `jest.config.*`, `playwright.config.*`） | テストが必要とする外部リソース                  |
| `.env`, `.env.example`, `.env.local`                                            | API エンドポイントの URL                        |
| `docker-compose*.yml`                                                           | 外部サービスへの依存                            |
| CI 設定（`.github/workflows/*.yml`）                                            | CI で実行されるコマンド（ローカル再現時の参考） |

全ファイルを読む必要はない。存在するものだけを対象にする。

**注意**: `.env` ファイルからは URL・ホスト名のみを抽出する。シークレット値（API キー、トークン等）はレポートに含めない。

### 2b: ユーザーへのヒアリング

自動収集の結果を踏まえ、以下をユーザーに確認する:

- 自動収集で見つかったコマンド・フロー以外に、エージェントに実行させたい操作はあるか
- 特定の外部サービス（DB、API、SaaS）へのアクセスが必要か
- worktree を使った並列開発を行うか（ファイルシステム制約に影響）

---

## Phase 3: 互換性チェック

収集した開発フローの各項目について、sandbox 制約との適合性を検証する。

### 3a: ネットワーク制約チェック

開発フローが必要とする外部ホストが `sandbox.network.allowedDomains`（または `allowedHosts`）に含まれているか確認する。

チェック観点:

- **パッケージレジストリ**: `pnpm install` / `npm install` → `registry.npmjs.org` が必要
- **GitHub 関連**: `gh` CLI → `github.com`, `api.github.com`、raw コンテンツ → `*.githubusercontent.com`
- **テストの外部アクセス**: E2E テストが外部 API を呼ぶ場合のホスト
- **MCP サーバー**: Playwright MCP → ブラウザダウンロード先、その他 MCP のエンドポイント
- **開発サーバー**: `localhost` はデフォルトで許可されているため通常は問題ない

ワイルドカード（`*.example.com`）のマッチングを考慮する。

よくあるツールが必要とするホストの一覧は `references/common-hosts.md` を参照する。

### 3b: ファイルシステム制約チェック

開発フローが書き込む可能性のあるパスが sandbox の書き込み許可範囲内か確認する。

チェック観点:

- **カレントディレクトリ**: デフォルトで書き込み可能（`.` は許可済み）
- **一時ファイル**: テストが `/tmp` を直接使用していないか（sandbox では `$TMPDIR` を使う必要がある）
- **グローバルキャッシュ**: `~/.local/share/pnpm`, `~/.npm`, `~/.cache` 等への書き込み
- **worktree**: プロジェクト外にワークツリーを作成する場合、`../` や絶対パスの許可が必要
- **ツール固有**: Playwright のブラウザキャッシュ、ESLint のキャッシュディレクトリ等

### 3c: ツール許可チェック

`permissions.allow` の設定が開発フローに必要なツール実行パターンをカバーしているか確認する。ただし `autoAllowBashIfSandboxed: true` の場合、Bash コマンドは sandbox 内で自動許可されるため、個別の Bash 許可は不要。

---

## Phase 4: レポート出力

チェック結果をユーザーに以下の形式でレポートする。

### レポート構成

```
## Sandbox 互換性チェック結果

### 環境情報
- Sandbox: 有効/無効
- 設定ファイル: (検出されたファイル一覧)

### ネットワーク制約
| 必要なホスト | 用途 | 許可状況 |
|---|---|---|
| registry.npmjs.org | pnpm install | OK |
| api.example.com | E2E テスト | NG - 未許可 |

### ファイルシステム制約
| パス | 用途 | 許可状況 |
|---|---|---|
| $TMPDIR | テスト一時ファイル | OK |
| ~/.cache/ms-playwright | Playwright ブラウザ | NG - 未許可 |

### 問題の概要
- (問題がある場合) 具体的な問題点と影響
- (問題がない場合) "現在の sandbox 設定で開発フローに問題は検出されませんでした"

### 推奨アクション
- (必要に応じて) settings.json への追加設定例
```

推奨アクションでは、具体的な JSON スニペットを提示する。例:

```json
{
  "sandbox": {
    "network": {
      "allowedDomains": ["api.example.com"]
    },
    "filesystem": {
      "allowWrite": ["~/.cache/ms-playwright"]
    }
  }
}
```

**注意**: レポートのみ出力する。settings.json の自動変更は行わない。

---

## Additional Resources

### Reference Files

- **`references/common-hosts.md`** — よくある開発ツール・フレームワークが必要とするネットワークホストとファイルシステムパスの一覧
