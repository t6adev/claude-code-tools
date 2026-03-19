# プロジェクト名（Python）

## よく使うコマンド

```bash
# 仮想環境の有効化
source .venv/bin/activate    # または: uv run

# 依存関係のインストール
pip install -e ".[dev]"      # または: uv sync

# 開発サーバー起動
python -m uvicorn app.main:app --reload    # FastAPI
python manage.py runserver                  # Django

# テスト
pytest                        # 全テスト
pytest tests/unit             # ユニットテストのみ
pytest -x                     # 最初の失敗で停止

# リント・フォーマット
ruff check .                  # リント
ruff format .                 # フォーマット
mypy .                        # 型チェック
```

## コーディング規約

- Python 3.10+ の型ヒントを使う（`str | None` など union 型）
- 型アノテーションはすべての関数に付ける（`mypy --strict` 相当）
- データクラスは `@dataclass` または Pydantic モデルを使う
- 定数は `UPPER_SNAKE_CASE`、クラスは `PascalCase`、関数・変数は `snake_case`
- インポートは isort / ruff でソートする（標準ライブラリ → サードパーティ → 内部）

## ディレクトリ構成

```
src/
└── <package_name>/
    ├── __init__.py
    ├── main.py          # エントリーポイント
    ├── models/          # データモデル
    ├── services/        # ビジネスロジック
    ├── repositories/    # データアクセス層
    └── utils/           # ユーティリティ

tests/
├── unit/
├── integration/
└── conftest.py          # フィクスチャ定義
```

## テスト方針

- テストフレームワーク: pytest
- 外部依存（DB・外部API）はフィクスチャでモックする
- テスト関数名: `test_<何を>_<どんな条件で>_<期待結果>`
- `conftest.py` に共通フィクスチャをまとめる

## エラーハンドリング

- カスタム例外クラスを `exceptions.py` に集約する
- `Exception` の裸の `except` は使わない（最低でも `except Exception as e`）
- ログは `logging` モジュールを使う（`print` は使わない）

## 環境変数

- 設定は `pydantic-settings` または `python-decouple` で管理する
- `.env.example` を用意し、実際の `.env` は Git に含めない

## 重要な制約

- Python バージョン: `.python-version` または `pyproject.toml` の `requires-python` を参照
- 依存関係の追加は `pyproject.toml` に記載する（`requirements.txt` は生成物）
