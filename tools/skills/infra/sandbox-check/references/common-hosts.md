# よくあるツールが必要とするホスト・パス一覧

sandbox 設定の互換性チェック時に参照するリファレンス。

## ネットワークホスト

### パッケージマネージャ

| ツール            | 必要なホスト                         | 備考               |
| ----------------- | ------------------------------------ | ------------------ |
| npm / pnpm / yarn | `registry.npmjs.org`                 | npm レジストリ     |
| yarn (classic)    | `registry.yarnpkg.com`               | yarn v1 レジストリ |
| pip / poetry      | `pypi.org`, `files.pythonhosted.org` | Python パッケージ  |
| cargo             | `crates.io`, `static.crates.io`      | Rust パッケージ    |
| gem               | `rubygems.org`                       | Ruby パッケージ    |
| go modules        | `proxy.golang.org`, `sum.golang.org` | Go モジュール      |

### GitHub 関連

| 用途            | 必要なホスト                    | 備考                  |
| --------------- | ------------------------------- | --------------------- |
| git clone/push  | `github.com`                    | Git 操作              |
| gh CLI          | `api.github.com`                | GitHub API            |
| raw コンテンツ  | `*.githubusercontent.com`       | README 画像等         |
| GitHub Actions  | `objects.githubusercontent.com` | アーティファクト      |
| GitHub Packages | `npm.pkg.github.com`            | GitHub npm レジストリ |

### テストツール

| ツール     | 必要なホスト                            | 備考                           |
| ---------- | --------------------------------------- | ------------------------------ |
| Playwright | `playwright.azureedge.net`              | ブラウザバイナリのダウンロード |
| Cypress    | `download.cypress.io`, `cdn.cypress.io` | Cypress バイナリ               |
| Puppeteer  | `storage.googleapis.com`                | Chromium ダウンロード          |

### MCP サーバー

| MCP            | 必要なホスト               | 備考                 |
| -------------- | -------------------------- | -------------------- |
| Playwright MCP | `playwright.azureedge.net` | 初回ブラウザDL時     |
| Fetch MCP      | アクセス先に依存           | URL ごとに許可が必要 |

### その他よくあるサービス

| サービス      | 必要なホスト                                                                 | 備考              |
| ------------- | ---------------------------------------------------------------------------- | ----------------- |
| Anthropic API | `api.anthropic.com`                                                          | Claude API 利用時 |
| OpenAI API    | `api.openai.com`                                                             | OpenAI 利用時     |
| Docker Hub    | `registry-1.docker.io`, `auth.docker.io`, `production.cloudflare.docker.com` | Docker イメージ   |
| Sentry        | `*.sentry.io`                                                                | エラー監視        |
| Datadog       | `*.datadoghq.com`                                                            | 監視              |

---

## ファイルシステム書き込みパス

### パッケージマネージャのキャッシュ

| ツール | 書き込みパス          | 備考             |
| ------ | --------------------- | ---------------- |
| pnpm   | `~/.local/share/pnpm` | グローバルストア |
| npm    | `~/.npm`              | キャッシュ       |
| yarn   | `~/.yarn`             | キャッシュ       |
| pip    | `~/.cache/pip`        | キャッシュ       |

### テストツール

| ツール     | 書き込みパス             | 備考                         |
| ---------- | ------------------------ | ---------------------------- |
| Playwright | `~/.cache/ms-playwright` | ブラウザバイナリ             |
| Cypress    | `~/.cache/Cypress`       | バイナリキャッシュ           |
| Jest       | `/tmp` または `$TMPDIR`  | スナップショット一時ファイル |

### ビルドツール

| ツール     | 書き込みパス                                        | 備考                   |
| ---------- | --------------------------------------------------- | ---------------------- |
| Turborepo  | `~/.cache/turbo` または `node_modules/.cache/turbo` | ビルドキャッシュ       |
| ESLint     | `node_modules/.cache/eslint` または `.eslintcache`  | リントキャッシュ       |
| TypeScript | `./tsconfig.tsbuildinfo`                            | インクリメンタルビルド |

### worktree

| 操作             | 書き込みパス                          | 備考                             |
| ---------------- | ------------------------------------- | -------------------------------- |
| git worktree add | プロジェクトの親ディレクトリ（`../`） | プロジェクト外への書き込みが必要 |

---

## ローカルポートバインドが必要なツール

以下のツールはローカルにサーバーを起動するため、macOS sandbox では `network.allowLocalBinding: true` が必要。

| ツール                        | 用途                       | 備考                                   |
| ----------------------------- | -------------------------- | -------------------------------------- |
| wrangler (Cloudflare Workers) | `pnpm test` / `pnpm build` | `@cloudflare/vitest-pool-workers` 含む |
| Vite dev server               | `pnpm dev`                 | HMR サーバー                           |
| Playwright test server        | `pnpm test`                | テストサーバー起動                     |
| Next.js dev server            | `pnpm dev`                 | 開発サーバー                           |
| webpack-dev-server            | `pnpm dev`                 | 開発サーバー                           |
| Storybook                     | `pnpm storybook`           | UI コンポーネント開発                  |

---

### 一時ファイルに関する注意

sandbox 環境では `/tmp` への直接書き込みが制限される場合がある。テストコードが `/tmp` をハードコードしている場合、`$TMPDIR` 環境変数を使用するように修正する必要がある。sandbox モードでは `$TMPDIR` が自動的に書き込み可能なディレクトリに設定される。
