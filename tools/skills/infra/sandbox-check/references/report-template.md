# レポートテンプレート

sandbox-check スキルの Phase 5 で出力するレポートの形式定義。

## テンプレート

```
## Sandbox 互換性チェック結果

### 環境情報
- Sandbox: 有効/無効
- 設定ファイル: (検出されたファイル一覧)

### 静的チェック結果

#### ネットワーク制約
| 必要なホスト | 用途 | 許可状況 |
|---|---|---|
| registry.npmjs.org | pnpm install | OK |
| api.example.com | E2E テスト | NG - 未許可 |

#### ファイルシステム制約
| パス | 用途 | 許可状況 |
|---|---|---|
| $TMPDIR | テスト一時ファイル | OK |
| ~/.cache/ms-playwright | Playwright ブラウザ | NG - 未許可 |

### 実行検証結果

| コマンド | 結果 | 原因 | 詳細 |
|---------|------|------|------|
| pnpm install | OK | - | - |
| pnpm test | NG | NETWORK | ENOTFOUND: api.stripe.com |
| pnpm build | OK | - | - |

(Phase 4 をスキップした場合: "実行検証はスキップされました")

### 問題の概要
- (問題がある場合) 具体的な問題点と影響
- (問題がない場合) "現在の sandbox 設定で開発フローに問題は検出されませんでした"

### 推奨アクション
(sandbox を有効にしたまま解決する設定変更を1つだけ提示)
```

## 推奨アクションの書き方

### sandbox 設定で解決できる場合

具体的な JSON スニペットを **1つだけ** 提示する。複数の代替案は不要。

良い例:

```
### 推奨アクション

`.claude/settings.json` に以下を追加:

{
  "sandbox": {
    "network": {
      "allowedDomains": ["api.stripe.com"]
    }
  }
}
```

悪い例（複数の代替案を並べる）:

```
### 推奨アクション

方法1: allowedDomains に追加する
方法2: テストをモックに変更する
方法3: sandbox を無効化する
```

### ローカルポートバインドの問題

wrangler、Vite dev server、Playwright 等がローカルサーバーを起動する場合、`network.allowLocalBinding: true` で解決できる（macOS のみ）。

良い例:

```
### 推奨アクション

`.claude/settings.json` に以下を追加:

{
  "sandbox": {
    "network": {
      "allowLocalBinding": true
    }
  }
}
```

### sandbox 設定では解決できない場合

settings.json のどの設定でも解決できない場合:

1. なぜ設定変更では解決できないかを明確に説明する
2. sandbox 無効化は最終手段として1行で言及するのみ

### 推測で設定を提案しない

提案する設定キーが実際に存在し機能するかを、公式ドキュメント（https://code.claude.com/docs/en/settings）で確認する。
確認できない場合は「このオプションの存在は未確認」と明記する。

混同しやすい設定の正確な効果:

- `excludedCommands` — sandbox **外**でコマンドを実行する（sandbox 内の制約バイパスではない）
- `enableWeakerNetworkIsolation` — TLS trust service へのアクセス許可（macOS）。アウトバウンド接続やローカルバインドの許可ではない
- `network.allowLocalBinding` — localhost ポートバインド（listen）の許可（macOS）
- `network.allowedDomains` — アウトバウンドネットワーク通信の許可ドメイン

## 注意事項

- レポートのみ出力する。settings.json の自動変更は行わない。
