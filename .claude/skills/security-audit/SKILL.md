---
name: security-audit
description: 複数のセキュリティレビュアーを並列起動し、結果を統合した上で実際の攻撃テストを実施する。
---

# セキュリティ監査

複数の視点からセキュリティレビューを実施し、実際の攻撃テストで検証する。

## 手順

### 1. 並列レビューの実施

security-reviewerサブエージェントを3つ並列で起動：

1. **脆弱性レビュー A** - 認証・認可、入力検証、XSS、CSRF等
2. **脆弱性レビュー B** - 同じ観点で独立してレビュー（一致度で信頼性を判断）
3. **攻撃者シミュレーション** - 攻撃者の視点で「どこから攻めるか」を分析

```
Task(security-reviewer): "認証・認可、入力検証、XSS、CSRFの観点でレビューして"
Task(security-reviewer): "同じ観点で独立してレビューして"
Task(security-reviewer): "攻撃者として、どこから攻めるか分析して。実際にcurlで攻撃テストも実施して"
```

### 2. 結果の統合

`docs/SECURITY_REPORT.md` に統合する：

```markdown
# Security Report

## 診断一致（複数が指摘）
| 脆弱性 | レビューA | レビューB | 攻撃者 | 重大度 |
|--------|-----------|-----------|--------|--------|
| OAuth state欠如 | Yes | Yes | Yes | Critical |

## TOP 3 攻撃ベクター
1. [攻撃者エージェントが特定した最も危険な箇所]
2. ...
3. ...

## Critical
...

## High
...
```

### 3. 実際の攻撃テスト

レビュー結果を検証するため、実際にcurlで攻撃テストを実施：

```bash
# 開発サーバーを起動
pnpm dev

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

# SQLインジェクション（該当箇所があれば）
curl -s http://localhost:8787/api/schedules?title="'; DROP TABLE schedules;--"
# 期待: 正常に処理される（クエリがパラメータ化されている）
```

### 4. レポート更新

テスト結果を反映し、総合評価を更新：

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

## 注意事項

- レビュー結果を鵜呑みにしない。「ファイルがGitに混入」など致命的な指摘は `git ls-files` で必ず検証
- 両者が同じ問題を指摘していれば信頼性が高い
- 片方だけが指摘している問題は特に慎重に検討する
- 攻撃テストは開発環境でのみ実施する
