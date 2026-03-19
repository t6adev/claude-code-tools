# プロジェクト名（Go）

## よく使うコマンド

```bash
go run ./cmd/server        # サーバー起動
go build ./...             # ビルド
go test ./...              # テスト実行
go test -race ./...        # レースコンディション検出
go vet ./...               # 静的解析
golangci-lint run          # リント

# モジュール管理
go mod tidy                # 未使用依存を削除・go.sum を更新
go get <package>@<version> # 依存追加
```

## コーディング規約

- `gofmt` / `goimports` のフォーマットに従う（CI で強制）
- エラーは必ず処理する（`_` で無視しない）
- パッケージ名は小文字・単数形（`user` not `users`）
- インターフェースは小さく保つ（1〜3メソッド）
- コメントは `// FunctionName ...` の形式でドキュメントコメントを書く

## ディレクトリ構成（標準レイアウト）

```
cmd/
└── server/
    └── main.go         # エントリーポイント

internal/               # 外部から使われないパッケージ
├── handler/            # HTTP ハンドラ
├── service/            # ビジネスロジック
├── repository/         # データアクセス
└── model/              # ドメインモデル

pkg/                    # 外部に公開するパッケージ
config/                 # 設定読み込み
```

## エラーハンドリング

- エラーは呼び出し元に返す（`log.Fatal` はメインのみ）
- エラーラップには `fmt.Errorf("context: %w", err)` を使う
- カスタムエラー型は `errors.Is` / `errors.As` に対応させる
- センチネルエラーは `var ErrNotFound = errors.New("not found")` で定義

## テスト方針

- テストファイル: `*_test.go`（同一パッケージ内）
- テーブル駆動テストを使う
- `testify` を使う場合は `assert` / `require` を使い分ける
- インターフェースでモックを注入する（`gomock` / 手書き）

## 設定管理

- 環境変数は `os.Getenv` を直接使わず `config` パッケージ経由でアクセス
- 設定構造体にデフォルト値を持たせる

## 重要な制約

- Go バージョン: `go.mod` の `go` ディレクティブを参照
- `init()` 関数の使用は最小限にする
- グローバル変数は避ける（テスト困難になるため）
