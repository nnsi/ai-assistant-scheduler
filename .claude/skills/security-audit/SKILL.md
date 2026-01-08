---
name: security-audit
description: 複数のセキュリティレビュアーを並列起動し、結果を統合した上で実際の攻撃テストを実施する。
---

# セキュリティ監査

複数の視点からセキュリティレビューを実施し、実際の攻撃テストで検証する。

## 重要な注意事項

**security-reviewerサブエージェントにはBashツールがない。**

したがって：
- サブエージェントは**コード分析のみ**を行う
- **攻撃テスト（curl等）は自分で実施**する必要がある
- 「攻撃者シミュレーション」を依頼しても、コードを読んだ感想が返ってくるだけ

## 手順

### 1. 並列レビューの実施

security-reviewerサブエージェントを**2つ**並列で起動：

```
Task(security-reviewer): "認証・認可、入力検証、XSS、CSRFの観点でコードレビューして"
Task(security-reviewer): "同じ観点で独立してレビューして（一致度で信頼性を判断）"
```

注意：「攻撃テストを実施して」と依頼してもBashがないので実行できない。

### 2. 結果の検証

**サブエージェントの指摘を鵜呑みにしない。** 以下を必ず確認：

```bash
# 「〜が実装されていない」→ 実際にコードをgrepして確認
grep -r "authMiddleware" packages/backend/src/

# 「ファイルがGitに混入」→ git ls-filesで確認
git ls-files | grep ".dev.vars"

# 「〜の検証がない」→ 該当コードを読んで確認
```

**過去の誤検出例：**
- 「.dev.varsがGitに混入」→ 実際は.gitignoreに入っており混入していなかった
- 「認証の欠如」→ 実際はOAuth実装済みだった
- 「JWT exp検証がない」→ hono/jwtは自動でexp検証する

### 3. 結果の統合

`docs/SECURITY_REPORT.md` に統合する：

```markdown
# Security Report

## 診断一致（複数が指摘）
| 脆弱性 | レビューA | レビューB | 重大度 |
|--------|-----------|-----------|--------|
| OAuth state欠如 | Yes | Yes | Critical |

## Critical
...

## High
...
```

### 4. 自分で攻撃テストを実施

開発サーバーを起動して、curlで攻撃テストを実行：

```bash
# 開発サーバーを起動
pnpm dev &

# 認証なしアクセス
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/api/schedules
# 期待: 401

# 不正なJWT
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/api/schedules \
  -H "Authorization: Bearer invalid-token"
# 期待: 401

# JWT alg:none攻撃
curl -s -o /dev/null -w "%{http_code}" http://localhost:8787/api/schedules \
  -H "Authorization: Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0."
# 期待: 401

# CORS違反
curl -s -I http://localhost:8787/api/schedules \
  -H "Origin: https://evil.com" | grep -i "access-control"
# 期待: Access-Control-Allow-Originヘッダーなし

# リダイレクトURI改ざん
curl -s -o /dev/null -w "%{http_code}" \
  "http://localhost:8787/api/auth/google?redirect_uri=https://evil.com"
# 期待: 400

# SQLインジェクション（Drizzle使用なら通常は安全）
curl -s "http://localhost:8787/api/schedules?title='; DROP TABLE schedules;--"
# 期待: 正常に処理される
```

### 5. レポート更新

テスト結果を反映：

```markdown
## 攻撃テスト結果

| 攻撃 | 結果 | 備考 |
|------|------|------|
| 認証なしアクセス | 401 防御成功 | |
| 不正なJWT | 401 防御成功 | |
| CORS evil origin | ヘッダーなし 防御成功 | |

## 総合評価

**A** - 主要な攻撃ベクターは全て防御されている
```

## チェックリスト

- [ ] security-reviewerを2つ並列で起動した
- [ ] 両者の指摘を比較した（一致=信頼度高）
- [ ] 致命的な指摘は`git ls-files`等で検証した
- [ ] 攻撃テストを**自分で**curlで実施した
- [ ] レポートを作成した
