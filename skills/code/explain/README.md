# explain

コードを平易な言葉で説明します。何をするか・なぜそう書かれているか・注意点を解説します。

## 使い方

```
/explain [file-path or function-name]
```

## 例

```bash
# ファイルを説明
/explain src/auth/jwt.ts

# 関数を説明
/explain verifyToken

# 引数なし（選択中のコードや文脈から判断）
/explain
```

## 出力例

```
## verifyToken の説明

### 概要
JWTトークンの署名を検証し、ペイロードを返す関数です。
無効なトークンの場合は例外をスローします。

### 動作の説明
1. トークンをヘッダー・ペイロード・署名の3つに分割
2. HMAC-SHA256 で署名を検証
3. 有効期限（exp クレーム）を確認
4. 検証済みペイロードを返す

### 重要な設計上の判断
- 署名の検証に timing-safe な比較を使用（タイミング攻撃対策）
- エラーの詳細は呼び出し元に漏らさない（セキュリティのため汎用メッセージ）

### 注意点
- `SECRET_KEY` が短い場合はブルートフォース攻撃に脆弱
- トークンのリボケーション（失効）はサポートしていない
```

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/skills/code/explain ~/.claude/skills/explain

# プロジェクト（コピー）
cp -r ~/path/to/claude-code-tools/skills/code/explain .claude/skills/
```
