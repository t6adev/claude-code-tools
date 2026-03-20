# test-writer

テスト生成専門のサブエージェントです。既存コードを分析し、包括的なテストを作成します。

## 使い方

```
src/auth/jwt.ts のテストを書いてください
```

または明示的に:

```
@test-writer で UserService のテストを生成してください
```

## 対応テストスタイル

既存のプロジェクトのテストフレームワーク・スタイルに自動的に合わせます。

- **TypeScript/JavaScript**: Jest, Vitest, Mocha
- **Python**: pytest, unittest
- **Go**: testing パッケージ
- **Ruby**: RSpec, Minitest

## 生成されるテストケース

| 種類         | 内容                       |
| ------------ | -------------------------- |
| 正常系       | 期待通りの入力・出力       |
| 異常系       | エラー・例外のハンドリング |
| エッジケース | 境界値・空値・null・最大値 |

## 出力例

```typescript
describe("verifyToken", () => {
  it("should return payload for valid token", () => {
    const token = sign({ userId: "123" }, SECRET);
    const result = verifyToken(token);
    expect(result.userId).toBe("123");
  });

  it("should throw TokenExpiredError when token is expired", () => {
    const token = sign({ userId: "123" }, SECRET, { expiresIn: -1 });
    expect(() => verifyToken(token)).toThrow(TokenExpiredError);
  });

  it("should throw InvalidTokenError for malformed token", () => {
    expect(() => verifyToken("not-a-token")).toThrow(InvalidTokenError);
  });
});
```

## インストール

```bash
# グローバル（シンボリックリンク）
ln -s ~/path/to/claude-code-tools/agents/testing/test-writer ~/.claude/agents/test-writer

# プロジェクト
cp -r ~/path/to/claude-code-tools/agents/testing/test-writer .claude/agents/
```
