# プロダクション公開前チェックリスト

本ドキュメントは、AI Assistant Scheduler をプロダクションとして公開する前に必要なタスクを、3つの観点から合議してまとめたものです。

## 合議参加者
1. **セキュリティ・インフラ担当** - 認証、セキュリティ、インフラ設計の観点
2. **コード品質・テスト担当** - コード品質、テスト、ドキュメントの観点
3. **総合調整担当** - 運用、UX、コンプライアンスの観点

---

## 優先度レベル

| レベル | 説明 |
|--------|------|
| 🔴 **Critical** | デプロイ前に必須。これがないと本番運用できない |
| 🟠 **High** | リリース前に強く推奨。セキュリティ・安定性に直結 |
| 🟡 **Medium** | リリース後1ヶ月以内に対応すべき |
| 🟢 **Low** | 将来対応でも可。継続的改善項目 |

---

## 手動操作が必要な項目（コードで自動化できないもの）

以下はユーザー自身が外部サービスやダッシュボードで操作・設定する必要がある項目です。

### 🔴 Critical（デプロイ前必須）

#### 1. Google Cloud Console での OAuth 設定
```
1. https://console.cloud.google.com/ にアクセス
2. プロジェクトを作成または選択
3. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuthクライアントID」
4. アプリケーションの種類：「ウェブアプリケーション」
5. 承認済みの JavaScript 生成元：stg/prod両方のフロントエンドURL
6. 承認済みのリダイレクトURI：stg/prod両方のコールバックURL
7. クライアントID と クライアントシークレット をメモ
```
**取得するもの:**
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

#### 2. OpenRouter API キー取得
```
1. https://openrouter.ai/ にアクセス
2. アカウント作成・ログイン
3. 「API Keys」→「Create Key」
4. キーをメモ（sk-or-v1-... 形式）
```
**取得するもの:**
- `OPENROUTER_API_KEY`

#### 3. JWT シークレット生成
```bash
# ターミナルで実行（stg/prod用に2つ生成推奨）
openssl rand -base64 32  # staging用
openssl rand -base64 32  # production用
```
**取得するもの:**
- `JWT_SECRET`（32文字以上の乱数文字列）

#### 4. Terraform State 用 R2 バケット作成
```bash
# Terraform state を保存する R2 バケットを作成
wrangler r2 bucket create terraform-state
```

#### 5. R2 API トークン作成（Terraform backend 用）
```
1. Cloudflare ダッシュボード → R2 → 概要 → 「R2 API トークンを管理」
2. 「API トークンを作成する」
3. 権限: オブジェクトの読み取りと書き込み
4. バケット: terraform-state を選択
5. Access Key ID と Secret Access Key をメモ
```
**取得するもの:**
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`

#### 6. Terraform で D1/KV を作成
```
1. GitHub リポジトリ → Actions → Infrastructure
2. 「Run workflow」→ action: plan → 実行（変更内容を確認）
3. 「Run workflow」→ action: apply → 実行（リソース作成）
4. GitHub Environment Variables (D1_DATABASE_ID, KV_NAMESPACE_ID) が自動設定される
   ※ 自動設定には GH_PAT (Personal Access Token) が必要
   ※ GH_PAT がない場合は、ワークフローログから ID をコピーして手動設定
```

> **Note:** wrangler.toml への直接設定は不要です。GitHub Actions がデプロイ時に自動で wrangler.toml を書き換えます。

#### 7. GitHub Environments 設定
```
1. GitHub リポジトリ → Settings → Environments
2. 「staging」環境を作成
3. 「production」環境を作成（必要に応じてRequired reviewers設定）
```

#### 8. GitHub Actions Secrets 設定
```
GitHub リポジトリ → Settings → Secrets and variables → Actions

【Repository Secrets（リポジトリ共通）】
- CLOUDFLARE_API_TOKEN: Cloudflare APIトークン（下記権限が必要）
  - Account > D1: Edit
  - Account > Workers KV Storage: Edit
  - Account > Workers Scripts: Edit
- CLOUDFLARE_ACCOUNT_ID: CloudflareアカウントID
- R2_ACCESS_KEY_ID: R2 API Access Key ID（Terraform state用）
- R2_SECRET_ACCESS_KEY: R2 API Secret Access Key（Terraform state用）
- GH_PAT: GitHub Personal Access Token（repo スコープ、Variables自動更新用、任意）

【staging環境のSecrets】（Settings → Environments → staging）
- JWT_SECRET: ステージング用JWTシークレット
- GOOGLE_CLIENT_ID: Google OAuth クライアントID
- GOOGLE_CLIENT_SECRET: Google OAuth クライアントシークレット
- OPENROUTER_API_KEY: OpenRouter APIキー

【staging環境のVariables】
- D1_DATABASE_ID: Terraform apply で自動設定（または手動設定）
- KV_NAMESPACE_ID: Terraform apply で自動設定（または手動設定）
- FRONTEND_URL: https://your-stg-frontend.pages.dev
- VITE_API_URL: https://ai-scheduler-api-stg.your-subdomain.workers.dev
- ALLOWED_REDIRECT_URIS: https://your-stg-frontend.pages.dev/callback （セキュリティ必須）

【production環境のSecrets】（Settings → Environments → production）
- JWT_SECRET: 本番用JWTシークレット
- GOOGLE_CLIENT_ID: Google OAuth クライアントID
- GOOGLE_CLIENT_SECRET: Google OAuth クライアントシークレット
- OPENROUTER_API_KEY: OpenRouter APIキー

【production環境のVariables】
- D1_DATABASE_ID: Terraform apply で自動設定（または手動設定）
- KV_NAMESPACE_ID: Terraform apply で自動設定（または手動設定）
- FRONTEND_URL: https://your-prod-frontend.pages.dev
- VITE_API_URL: https://ai-scheduler-api-prod.your-subdomain.workers.dev
- ALLOWED_REDIRECT_URIS: https://your-prod-frontend.pages.dev/callback （セキュリティ必須）
```

---

### デプロイフロー

```
master ブランチにマージ → staging環境にデプロイ
release ブランチにマージ → production環境にデプロイ
```

---

### 🟠 High（リリース前推奨）

#### 8. GitHub Branch Protection 設定
```
1. GitHub リポジトリ → Settings → Branches
2. 「Add branch protection rule」
3. Branch name pattern: master（および release）
4. 以下をチェック:
   - Require a pull request before merging
   - Require status checks to pass before merging
     - test, typecheck, build を追加
   - Require branches to be up to date before merging
```

#### 9. エラートラッキングサービス登録（Sentry 推奨）
```
1. https://sentry.io/ でアカウント作成
2. プロジェクト作成（JavaScript / Node.js）
3. DSN をメモ
4. wrangler secret put SENTRY_DSN --env production
```
**取得するもの:**
- `SENTRY_DSN`

#### 9. 本番ドメイン設定（Cloudflare Workers）
```
1. Cloudflare ダッシュボード → Workers & Pages
2. Worker選択 → Settings → Domains & Routes
3. 独自ドメインを追加（DNS設定が必要）
```

---

### 🟡 Medium（リリース後対応可）

#### 10. GitHub Secret Scanning 有効化
```
1. GitHub リポジトリ → Settings → Code security and analysis
2. 「Secret scanning」を Enable
3. 「Push protection」を Enable（推奨）
```

#### 11. Cloudflare Cache Rules 設定
```
1. Cloudflare ダッシュボード → Rules → Cache Rules
2. 新規ルール作成
3. 条件: URI Path starts with /api/schedules
4. キャッシュ設定: Cache Everything, TTL 5分
```

#### 12. アラート設定（Slack/Discord 通知）
```
Sentry の場合:
1. Settings → Integrations → Slack/Discord
2. Alert Rules でエラー率閾値を設定
```

---

### 📝 ドキュメント作成（ユーザーが記述）

以下のドキュメントはサービス固有の内容を含むため、ユーザー自身で作成が必要です：

| ドキュメント | 内容 | テンプレート参考 |
|-------------|------|-----------------|
| **プライバシーポリシー** | 収集データ、利用目的、第三者提供 | [プライバシーポリシージェネレーター](https://www.freeprivacypolicy.com/) |
| **利用規約** | サービス条件、免責事項、禁止行為 | [利用規約ジェネレーター](https://www.termsofservicegenerator.net/) |
| **インシデント対応プロセス** | エスカレーションフロー、連絡先 | 社内テンプレート |

---

### チェックリスト形式

```
- [x] Google Cloud Console
  - [x] OAuth クライアントID取得
  - [x] OAuth クライアントシークレット取得
  - [x] stg/prod両方のリダイレクトURI設定

- [x] OpenRouter
  - [x] APIキー取得

- [x] ローカル
  - [x] JWT_SECRET 生成（stg用: openssl rand -base64 32）
  - [x] JWT_SECRET 生成（prod用: openssl rand -base64 32）

- [x] Cloudflare
  - [x] R2 バケット作成 (terraform-state)
  - [x] R2 API トークン作成

- [x] GitHub Environments
  - [x] staging 環境作成
  - [x] production 環境作成

- [x] GitHub Repository Secrets
  - [x] CLOUDFLARE_API_TOKEN
  - [x] CLOUDFLARE_ACCOUNT_ID
  - [x] R2_ACCESS_KEY_ID
  - [x] R2_SECRET_ACCESS_KEY
  - [x] GH_PAT

- [x] GitHub Secrets/Variables (staging)
  - [x] JWT_SECRET
  - [x] GOOGLE_CLIENT_ID
  - [x] GOOGLE_CLIENT_SECRET
  - [x] OPENROUTER_API_KEY
  - [x] FRONTEND_URL (Variable)
  - [x] VITE_API_URL (Variable)
  - [x] ALLOWED_REDIRECT_URIS (Variable)

- [] GitHub Secrets/Variables (production)
  - [] JWT_SECRET
  - [] GOOGLE_CLIENT_ID
  - [] GOOGLE_CLIENT_SECRET
  - [] OPENROUTER_API_KEY
  - [] FRONTEND_URL (Variable)
  - [] VITE_API_URL (Variable)
  - [] ALLOWED_REDIRECT_URIS (Variable)

- [] GitHub その他
  - [] Branch Protection 設定 (master, release)
  - [] Secret Scanning 有効化

- [] エラートラッキング（Sentry等）
  - [] アカウント作成
  - [] DSN 取得・設定

- [] ドキュメント
  - [] プライバシーポリシー作成
  - [] 利用規約作成
```

---

## 1. セキュリティ

### 🔴 Critical

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 1.1 | **AIエンドポイントのレート制限実装** | `/api/ai/suggest-keywords`, `/api/ai/search` は外部API（OpenRouter）を呼び出すため、DDoS/コスト攻撃のリスクが高い。Cloudflare Workers KV または Durable Objects で実装。ユーザーごと1時間10リクエスト推奨 | セキュリティ |
| 1.2 | **リダイレクトURI検証** | OAuth コールバック時の `redirectUri` が許可リストに含まれるか検証。悪意のあるリダイレクトを防止 | セキュリティ |
| 1.3 | **本番環境シークレット設定** | `wrangler secret put` で以下を設定: `JWT_SECRET`（32文字以上の強力な乱数）、`GOOGLE_CLIENT_ID`、`GOOGLE_CLIENT_SECRET`、`OPENROUTER_API_KEY` | セキュリティ |

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 1.4 | **PKCE対応** | OAuth 2.0 Security Best Practice に従い、フロントエンド・バックエンド両方でPKCEフローを実装 | セキュリティ |
| 1.5 | **セキュリティヘッダー追加** | CSP、X-Content-Type-Options: nosniff、X-Frame-Options: DENY、Strict-Transport-Security | コード品質 |
| 1.6 | **OAuthトークン交換レート制限** | 同一ユーザーからの多重リクエスト防止（1分3リクエスト制限） | セキュリティ |
| 1.7 | **CORS本番環境設定確認** | `FRONTEND_URL` 環境変数を本番ドメインに設定。localhost 開発用許可が本番で無効になることを確認 | セキュリティ |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 1.8 | **リフレッシュトークンクリーンアップ** | 期限切れレコードの定期削除。Scheduled Worker で実装 | コード品質 |
| 1.9 | **APIキーローテーション計画** | 3〜6ヶ月ごとのローテーション計画策定 | セキュリティ |
| 1.10 | **GitHub Secret Scanning有効化** | シークレット暴露の自動検出 | セキュリティ |

---

## 2. インフラ・デプロイメント

### 🔴 Critical

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 2.1 | **GitHub Actions CI/CD構築** | `.github/workflows/` に以下を作成: `test.yml`（pnpm test, typecheck）、`build.yml`（ビルド検証）、`deploy.yml`（本番デプロイ） | セキュリティ |
| 2.2 | **D1本番データベース作成** | 本番用 Database ID を取得し、`wrangler.toml` の `[env.production]` に設定 | セキュリティ |
| 2.3 | **マイグレーション自動化** | CI/CD パイプラインに `wrangler d1 migrations apply` を組み込み | セキュリティ |

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 2.4 | **エラートラッキング導入** | Sentry、Datadog、またはCloudflare Logpush で本番エラーを収集。`console.error` を構造化ログに置き換え | セキュリティ/コード品質 |
| 2.5 | **本番環境別設定** | `wrangler.toml` に `[env.production]` セクション追加。`FRONTEND_URL`、`USE_MOCK_AI=false`、Database ID を設定 | セキュリティ |
| 2.6 | **PRチェック必須化** | GitHub Branch Protection で test, typecheck, build がパスしないとマージ不可に設定 | セキュリティ |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 2.7 | **バックアップ戦略策定** | D1 データベースの自動バックアップ設定確認。最低1日1回、復旧テスト計画 | セキュリティ |
| 2.8 | **パフォーマンス監視** | CloudFlare Analytics、API レスポンスタイム監視、エラーレート監視 | セキュリティ |
| 2.9 | **アラート設定** | エラーレート5%以上でSlack通知など | セキュリティ |
| 2.10 | **ログ保持ポリシー** | 6ヶ月以上の保持ポリシー策定 | セキュリティ |

### 🟢 Low

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 2.11 | **マイグレーションロールバック戦略** | 各マイグレーションに down スクリプト作成（手動対応） | セキュリティ |

---

## 3. コード品質

### 🔴 Critical

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 3.1 | **console.error → 構造化ログ置き換え** | バックエンド6箇所、フロントエンド8箇所の `console.error` を本番用ログ戦略に置き換え | コード品質 |

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 3.2 | **ESLint + Prettier設定** | プロジェクト統一ルール策定。pre-commit hook で自動整形 | コード品質 |
| 3.3 | **フロントエンドエラーハンドリング改善** | `catch (e) { setError(e as Error) }` を `e instanceof Error ? e : new Error(String(e))` に統一 | コード品質 |
| 3.4 | **トークン更新ロジック統一** | `api.ts` と `AuthContext.tsx` で重複しているトークン更新ロジックをDRY化 | コード品質 |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 3.5 | **リクエストボディサイズ制限** | Honoミドルウェアで1MBなどの上限設定 | セキュリティ |

---

## 4. テスト

### 🔴 Critical

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 4.1 | **フロントエンド単体テスト導入** | 現在0%。Vitest + React Testing Library で主要フック（useSchedules, useAI, useAuth）のテスト作成 | コード品質 |
| 4.2 | **E2Eテスト完全実装** | 現在5個のみ。APIモック設定、主要フロー（ログイン→スケジュール作成→AI検索→ログアウト）をカバー | コード品質 |

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 4.3 | **エラーケーステスト追加** | 不正トークン、存在しないリソース、認可エラー（他ユーザーのリソースアクセス）のテスト | コード品質 |
| 4.4 | **テストカバレッジ計測** | `pnpm --filter backend test:coverage` を CI で実行、レポート生成 | コード品質 |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 4.5 | **負荷テスト** | K6 などで並行ユーザーテスト、AI API レスポンスタイム計測 | コード品質 |
| 4.6 | **エッジケーステスト** | タイムゾーン境界、同時実行、大量データ | コード品質 |

---

## 5. ドキュメント

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 5.1 | **README.md作成（ルート）** | プロジェクト概要、技術スタック、セットアップ手順、開発コマンド | コード品質 |
| 5.2 | **本番デプロイ手順書** | Cloudflare Workers デプロイ手順、環境変数設定手順 | 総合調整 |
| 5.3 | **Google Cloud Console設定ガイド** | OAuth 2.0 クライアント作成手順、リダイレクトURI設定 | コード品質 |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 5.4 | **API ドキュメント自動生成** | OpenAPI/Swagger 実装。Zod スキーマから生成 | コード品質 |
| 5.5 | **トラブルシューティングガイド** | よくある問題と解決方法 | 総合調整 |
| 5.6 | **インシデント対応プロセス** | エスカレーションフロー、連絡先、対応手順 | 総合調整 |
| 5.7 | **バックアップ・復旧手順書** | D1 バックアップ/リストア手順 | セキュリティ |

---

## 6. スケーラビリティ・パフォーマンス

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 6.1 | **ページネーション実装** | スケジュール一覧に `?page=1&limit=20` パラメータ追加。大量データ対応 | セキュリティ |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 6.2 | **CloudFlare Cache Rules設定** | API レスポンス（スケジュール一覧）のキャッシュ。TTL 5分 | セキュリティ |
| 6.3 | **インデックス最適化確認** | データ増加時の `idx_schedules_user_id`、`idx_refresh_tokens_user_id` 性能確認 | セキュリティ |

### 🟢 Low

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 6.4 | **Cursor-based Pagination** | offset-limit から cursor-based へ移行（大規模スケール時） | セキュリティ |

---

## 7. 運用・UX

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 7.1 | **ユーザーフレンドリーなエラーメッセージ** | 技術的なエラーコードを人間が理解できるメッセージに変換（フロントエンド） | 総合調整 |
| 7.2 | **ローディング状態の改善** | AI 検索など時間がかかる処理のプログレス表示 | 総合調整 |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 7.3 | **複数デバイスセッション管理UI** | 現在のセッション一覧表示、「全デバイスからログアウト」機能 | セキュリティ |
| 7.4 | **タイムゾーン対応** | ユーザーごとのタイムゾーン設定UI、表示時の変換 | セキュリティ |
| 7.5 | **オフライン対応** | Service Worker によるオフラインキャッシュ（将来検討） | 総合調整 |

---

## 8. 法的・コンプライアンス

### 🟠 High

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 8.1 | **プライバシーポリシー作成** | 収集するデータ、利用目的、第三者提供の有無を明記 | 総合調整 |
| 8.2 | **利用規約作成** | サービス利用条件、免責事項、禁止行為 | 総合調整 |

### 🟡 Medium

| # | タスク | 詳細 | 担当観点 |
|---|--------|------|----------|
| 8.3 | **GDPR対応（EU向け）** | ユーザーデータエクスポート機能、アカウント削除時の完全削除 | 総合調整 |
| 8.4 | **Cookie同意バナー** | 必要に応じて実装（トラッキング Cookie 使用時） | 総合調整 |

---

## 9. リリース前最終チェックリスト

### デプロイ直前（D-1）

- [ ] JWT_SECRET が強力な乱数（32文字以上）か確認
- [ ] 本番 Google OAuth 認証情報が設定されているか確認
- [ ] FRONTEND_URL が本番ドメインに設定されているか確認
- [ ] レート制限が実装されているか確認
- [ ] HTTPS が全エンドポイントで有効か確認
- [ ] CI/CD パイプラインが正常動作するか確認
- [ ] D1 マイグレーションが本番で実行済みか確認
- [ ] エラートラッキングが設定されているか確認

### リリース直後（D+1）

- [ ] 本番環境でログインフローが動作するか確認
- [ ] スケジュール作成・編集・削除が動作するか確認
- [ ] AI 機能が動作するか確認
- [ ] エラーログに異常がないか確認
- [ ] レスポンスタイムが許容範囲内か確認

---

## 10. 実装進捗

### Phase 1: Critical（デプロイ前必須）

#### コード実装タスク

- [x] **1.1 AIエンドポイントのレート制限実装**
  - `packages/backend/src/middleware/rateLimit.ts` 作成
  - Cloudflare KV によるユーザー単位レート制限
  - KV未設定時はグレースフルスキップ（ローカル開発対応）
- [x] **1.2 リダイレクトURI検証**
  - `packages/backend/src/shared/redirectUri.ts` 作成
  - localhost, *.pages.dev, カスタムドメイン対応
- [x] **2.1 GitHub Actions CI/CD構築**
  - `.github/workflows/ci.yml` - テスト・型チェック・ビルド（master/release両対応）
  - `.github/workflows/deploy.yml` - 環境別デプロイ
    - master → staging環境
    - release → production環境
  - GitHub Secrets経由でCloudflare Workersにシークレット自動登録
- [x] **2.3 マイグレーション自動化**
  - `deploy.yml` に `wrangler d1 migrations apply` 組み込み
- [x] **3.1 console.error → 構造化ログ置き換え**
  - `packages/backend/src/shared/logger.ts` 作成
  - `packages/frontend/src/lib/logger.ts` 作成
  - バックエンド・フロントエンド全箇所を構造化ログに置換
- [x] **4.1 フロントエンド単体テスト導入**
  - Vitest + React Testing Library 設定
  - `useAI.test.ts` - 6テスト
  - `useSchedules.test.ts` - 7テスト
- [x] **4.2 E2Eテスト完全実装**
  - Playwright 設定
  - `auth-flow.spec.ts` - 3テスト
  - `schedule-crud.spec.ts` - 4テスト
  - `ai-flow.spec.ts` - 4テスト

#### 手動設定タスク（ユーザー作業）

- [ ] **Cloudflare リソース作成**
  - D1データベース作成（stg/prod）→ Database ID をメモ
  - KV Namespace作成（stg/prod）→ KV ID をメモ
- [ ] **GitHub Environments 設定**
  - staging 環境作成
  - production 環境作成
- [ ] **GitHub Secrets/Variables 設定**
  - 各環境に Secrets 登録（CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, JWT_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OPENROUTER_API_KEY）
  - 各環境に Variables 登録（D1_DATABASE_ID, KV_NAMESPACE_ID, FRONTEND_URL, VITE_API_URL, ALLOWED_REDIRECT_URIS）
  - ※ wrangler.toml への ID 設定は不要（GitHub Actions が自動設定）

### テスト実行結果

| テスト種類 | 結果 | 備考 |
|-----------|------|------|
| バックエンドテスト | ✅ 74テスト合格 | 統合テスト含む |
| フロントエンドユニットテスト | ✅ 13テスト合格 | useAI, useSchedules |
| E2Eテスト | ⚠️ 17テスト定義済 | ローカル環境でPlaywrightブラウザ要インストール |

---

## 11. 実装ロードマップ

### Phase 1: Critical（デプロイ前必須）- ✅ コード実装完了

```
コード実装（完了）:
├── ✅ 1.1 AIエンドポイントのレート制限実装
├── ✅ 1.2 リダイレクトURI検証
├── ✅ 2.1 GitHub Actions CI/CD構築（stg/prod対応）
├── ✅ 2.3 マイグレーション自動化
├── ✅ 3.1 console.error → 構造化ログ置き換え
├── ✅ 4.1 フロントエンド単体テスト導入
└── ✅ 4.2 E2Eテスト完全実装

手動設定（ユーザー作業）:
├── ⏳ Cloudflareリソース作成（D1/KV stg+prod）→ ID をメモ
├── ⏳ GitHub Environments設定
└── ⏳ GitHub Secrets/Variables設定（D1_DATABASE_ID, KV_NAMESPACE_ID含む）
```

### Phase 2: High（リリース後1週間以内）

```
├── 1.4 PKCE対応
├── 1.5 セキュリティヘッダー追加
├── 1.6 OAuthトークン交換レート制限
├── 1.7 CORS本番環境設定確認
├── 2.4 エラートラッキング導入
├── 2.5 本番環境別設定
├── 2.6 PRチェック必須化
├── 3.2 ESLint + Prettier設定
├── 3.3 フロントエンドエラーハンドリング改善
├── 3.4 トークン更新ロジック統一
├── 4.3 エラーケーステスト追加
├── 4.4 テストカバレッジ計測
├── 5.1 README.md作成（ルート）
├── 5.2 本番デプロイ手順書
├── 5.3 Google Cloud Console設定ガイド
├── 6.1 ページネーション実装
├── 7.1 ユーザーフレンドリーなエラーメッセージ
├── 7.2 ローディング状態の改善
├── 8.1 プライバシーポリシー作成
└── 8.2 利用規約作成
```

### Phase 3: Medium（リリース後1ヶ月以内）

```
├── 1.8 リフレッシュトークンクリーンアップ
├── 1.9 APIキーローテーション計画
├── 1.10 GitHub Secret Scanning有効化
├── 2.7 バックアップ戦略策定
├── 2.8 パフォーマンス監視
├── 2.9 アラート設定
├── 2.10 ログ保持ポリシー
├── 3.5 リクエストボディサイズ制限
├── 4.5 負荷テスト
├── 4.6 エッジケーステスト
├── 5.4 API ドキュメント自動生成
├── 5.5 トラブルシューティングガイド
├── 5.6 インシデント対応プロセス
├── 5.7 バックアップ・復旧手順書
├── 6.2 CloudFlare Cache Rules設定
├── 6.3 インデックス最適化確認
├── 7.3 複数デバイスセッション管理UI
├── 7.4 タイムゾーン対応
├── 8.3 GDPR対応（EU向け）
└── 8.4 Cookie同意バナー
```

### Phase 4: Low（継続的改善）

```
├── 2.11 マイグレーションロールバック戦略
├── 6.4 Cursor-based Pagination
└── 7.5 オフライン対応
```

---

## 12. 現在良好な項目（対応不要）

以下の項目は既に適切に実装されています：

- ✅ OAuth + JWT 認証
- ✅ リフレッシュトークン定期ローテーション
- ✅ Zod による厳密なバリデーション
- ✅ DOMPurify による XSS 対策
- ✅ Drizzle ORM による SQL インジェクション対策
- ✅ エラーハンドリング（スタックトレース露出なし）
- ✅ ユーザーリソースアクセス制限（userId チェック）
- ✅ データベーススキーマ設計（適切なインデックス・外部キー制約）
- ✅ マイグレーション体系（Drizzle Kit）
- ✅ Result型による構造化エラーハンドリング（バックエンド）
- ✅ クリーンアーキテクチャに準拠したディレクトリ構造
- ✅ 依存注入（DI）によるテスト可能な設計
- ✅ TypeScript strict mode（any 型なし）
- ✅ ヘルスチェックエンドポイント

---

## 13. 合議のまとめ

### 3者の総合評価

| 観点 | 現状評価 | コメント |
|------|----------|----------|
| セキュリティ | ⚠️ 基本実装済み | レート制限・リダイレクト検証が最優先 |
| インフラ | ⚠️ 開発環境のみ | CI/CD・本番設定が必須 |
| コード品質 | ✅ 良好 | console.error の置き換えのみ |
| テスト | ❌ 不十分 | フロントエンドテストが皆無 |
| ドキュメント | ⚠️ 設計書のみ | セットアップ・運用ドキュメント不足 |
| スケーラビリティ | ⚠️ 基本対応 | ページネーション必須 |
| 運用・UX | ⚠️ 基本対応 | エラーメッセージ改善推奨 |
| コンプライアンス | ❌ 未対応 | プライバシーポリシー・利用規約必須 |

### 結論

**本番公開には Phase 1（Critical）の完了が必須です。**

特に以下の3点は最優先で対応してください：

1. **レート制限** - AIエンドポイントへの攻撃はコストに直結
2. **CI/CD構築** - 自動テスト・デプロイなしでの本番運用はリスクが高い
3. **フロントエンドテスト** - 現在カバレッジ0%は本番運用に不適切

Phase 1 完了後、1週間程度のステージング環境での検証を推奨します。
