# impact-analysis

ファイルやシンボルを変更する前に、その影響範囲（依存元・テスト）を列挙するスキル。

## 使い方

```
/impact-analysis [file-path | symbol-name]
```

## 例

```
# ファイルを指定
/impact-analysis src/utils/auth.ts

# シンボルを指定
/impact-analysis createSession

# 型を指定
/impact-analysis UserType
```

## 動作

1. 対象ファイルまたはシンボルを起点に import/require を Grep で追跡
2. 直接依存（1段階）と間接依存（2段階まで）を列挙
3. 影響を受けるテストファイルを特定
4. 「変更してはいけない箇所」を整理して報告

## 活用シーン

- 共有ユーティリティを修正する前
- 公開型定義（`export type`）を変更する前
- API レスポンスの形を変える前
- リファクタリングで影響範囲を事前確認したい時

## 制限

- `await import(変数)` のような動的インポートは検出できません
- 外部パッケージ（`node_modules`）は対象外です
- 最大2段階までの間接依存を追跡します
