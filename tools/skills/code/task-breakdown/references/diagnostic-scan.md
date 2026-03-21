# コードベース診断スキャン リファレンス

Phase 2 で使用する診断コマンドと検出パターンの詳細。

## 診断項目と検出方法

| 診断観点                   | 検出方法                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| テストの空白エリア         | ソースディレクトリに対応するテストファイルが存在しないディレクトリを特定                      |
| 壊れたCI                   | `.github/workflows/` を読み、`gh run list --limit 5` で直近の実行状態を確認                   |
| 未解決の TODO/FIXME        | ソース全体を Grep で検索                                                                      |
| 大きすぎるファイル         | 400行以上のソースファイルを列挙                                                               |
| エラーハンドリングの欠落   | 空の catch ブロックや unhandled promise パターンを Grep で検索                                |
| ハードコードされた秘密情報 | `password\s*=`, `api_key\s*=`, `secret\s*=` などを Grep（テストファイル・env ファイルを除く） |

## コマンド例

### TODO/FIXME の検索

```
Grep pattern="(TODO|FIXME|HACK|XXX)" glob="src/**/*" output_mode="content"
```

### 大きすぎるファイルの検出

```bash
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.py" -o -name "*.go" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*" \
  | xargs wc -l 2>/dev/null | sort -rn | head -20
```

### テストが存在しないディレクトリの特定

```bash
# ソースディレクトリを列挙して、対応するテストファイルを確認する
find src -type d | while read dir; do
  test_count=$(find "$dir" -maxdepth 1 -name "*.test.*" -o -name "*.spec.*" | wc -l)
  src_count=$(find "$dir" -maxdepth 1 -name "*.ts" -not -name "*.test.*" -not -name "*.spec.*" | wc -l)
  if [ "$src_count" -gt 0 ] && [ "$test_count" -eq 0 ]; then
    echo "No tests: $dir ($src_count source files)"
  fi
done
```

### 直近のCI実行状態

```bash
gh run list --limit 5
```

### 空の catch ブロック（TypeScript/JavaScript）

```
Grep pattern="catch\s*\([^)]*\)\s*\{\s*\}" glob="src/**/*.{ts,js}" output_mode="content"
```

### ハードコードされた秘密情報の疑い

```
Grep pattern="(password|api_key|secret|token)\s*=\s*['\"][^'\"]{8,}" glob="src/**/*" output_mode="content"
```

テストファイルや `.env.example` はスキャン対象から除外すること。

## スキャン結果の解釈

### 優先度判断の目安

| 検出内容                   | 優先度 | 理由                                   |
| -------------------------- | ------ | -------------------------------------- |
| ハードコードされた秘密情報 | 高     | セキュリティリスク・即時対応が必要     |
| 壊れたCI                   | 高     | 開発フロー全体がブロックされる         |
| テストなしの中核モジュール | 中     | リファクタリング・機能追加のリスク増大 |
| TODO/FIXME が多いファイル  | 中     | 意図的な負債の蓄積を示す可能性         |
| 400行超のファイル          | 低〜中 | 規模によるが即時の問題ではない         |
| 空の catch ブロック        | 低〜中 | バグ検出を困難にする                   |

### ユーザーへの提示形式

```
診断スキャンの結果:

🔴 高優先度:
- [ファイル名] にハードコードされた秘密情報が見つかりました
- CI (ワークフロー名) が直近5回中X回失敗しています

🟡 中優先度:
- src/payments/ にテストファイルが存在しません（Xファイル）
- TODO/FIXME が X件見つかりました（上位: [ファイル名]）

🟢 低優先度:
- [ファイル名] が X行（400行超）

タスクとして登録したいものはどれですか？
```
