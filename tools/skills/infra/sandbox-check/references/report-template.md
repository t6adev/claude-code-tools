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
- (必要に応じて) settings.json への追加設定例
```

## 推奨アクションの JSON スニペット例

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

## 注意事項

- レポートのみ出力する。settings.json の自動変更は行わない。
- 推奨アクションでは、具体的な JSON スニペットを提示して、ユーザーが設定ファイルにコピー&ペーストできるようにする。
