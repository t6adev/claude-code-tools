# minimal-repro

パッケージ・環境・アプリコードのどこに原因があるか切り分けるため、最小再現環境を複数パターン一括生成するスキル。

## 使い方

```
/minimal-repro この問題の再現環境を作って: Vite 6でビルドするとplugin-reactでエラーが出る
```

引数なしで実行すると、対話的に問題の詳細を確認します。

```
/minimal-repro
```

## 機能

1. 問題が起きたプロジェクトの環境（パッケージ、バージョン、設定）を分析
2. 原因の切り分けに適したパターンを設計（バージョン違い、依存除外、コード変更など）
3. パターンごとに独立したディレクトリを一括生成
4. 各パターンで `pnpm install && pnpm run repro` で即実行可能
5. 結果を一覧表にまとめ、原因の仮説を提示

## インストール

```bash
REPO=~/path/to/claude-code-tools
ln -s "$REPO/tools/skills/code/minimal-repro" ~/.claude/skills/minimal-repro
```
