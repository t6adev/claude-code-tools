---
name: sandbox-check
description: This skill should be used when the user asks to "sandboxの互換性をチェックして", "sandbox設定を確認して", "このプロジェクトでsandboxが使えるか調べて", "sandboxでコマンドが失敗する", "check sandbox compatibility", "verify sandbox settings", "sandbox is blocking my commands", or wants to ensure their development workflow works within Claude Code's sandbox restrictions — either proactively before starting work or reactively after encountering sandbox-related failures.
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

## Phase 3: 静的互換性チェック

収集した開発フローの各項目について、sandbox 制約との適合性を静的に検証する。

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

## Phase 4: 実行検証

静的チェックだけでは検出できない問題がある（暗黙の DNS 解決、ライブラリ内部の外部通信、ビルドツールのキャッシュ書き込み先等）。Phase 2 で収集したコマンドを実際に sandbox 環境内で実行し、問題を検出する。

### 4a: 実行候補の提示と確認

Phase 2 で収集したコマンドを一覧にしてユーザーに提示し、実行許可を求める。

提示形式:

```
## 実行検証の候補コマンド

以下のコマンドを sandbox 環境内で実際に実行し、制約による失敗がないか検証します。
実行してもよいですか？

| # | コマンド | 用途 | リスク |
|---|---------|------|--------|
| 1 | pnpm install | 依存インストール | 低（読み取り中心） |
| 2 | pnpm test | テスト実行 | 低（ローカル実行） |
| 3 | pnpm build | ビルド | 低（ローカル実行） |
| 4 | pnpm lint | リント | 低（ローカル実行） |

- 全て実行 / 番号を選択 / スキップ
```

**ユーザーがスキップを選択した場合は Phase 5 に進む。**

### 4b: コマンド実行と結果収集

ユーザーが許可したコマンドを順番に実行する。各コマンドについて以下を記録する:

- **成功/失敗**: exit code
- **失敗時のエラー内容**: stderr の関連部分（ネットワークエラー、パーミッションエラー等）
- **失敗の原因分類**:
  - `NETWORK` — ホスト名解決失敗、接続拒否、タイムアウト等
  - `FILESYSTEM` — 書き込み拒否、パーミッションエラー等
  - `OTHER` — sandbox 制約以外の原因（コードのバグ等）

sandbox 制約に起因しない失敗（テストコードのバグ等）は sandbox 互換性の問題として報告しない。エラーメッセージから原因を判別する。

判別のヒント:

- `ENOTFOUND`, `ECONNREFUSED`, `fetch failed`, `network timeout` → `NETWORK`
- `EACCES`, `EPERM`, `permission denied`, `read-only file system` → `FILESYSTEM`
- 上記に該当しない → `OTHER`（sandbox の問題ではない可能性が高い）

---

## Phase 5: レポート出力

`references/report-template.md` のテンプレートに従い、チェック結果をユーザーにレポートする。

レポートには以下のセクションを含める:

1. **環境情報** — sandbox の有効/無効、検出された設定ファイル
2. **静的チェック結果** — ネットワーク制約・ファイルシステム制約のテーブル
3. **実行検証結果** — 各コマンドの成功/失敗と原因分類（Phase 4 をスキップした場合はその旨を記載）
4. **問題の概要** — 検出された問題の影響
5. **推奨アクション** — settings.json への具体的な JSON スニペット

**注意**: レポートのみ出力する。settings.json の自動変更は行わない。

---

## Additional Resources

### Reference Files

- **`references/common-hosts.md`** — よくある開発ツール・フレームワークが必要とするネットワークホストとファイルシステムパスの一覧
- **`references/report-template.md`** — Phase 5 で出力するレポートのテンプレートと JSON スニペット例
