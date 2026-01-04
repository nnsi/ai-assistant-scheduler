import type { MiddlewareHandler } from "hono";
import { createTooManyRequestsError } from "../shared/errors";
import { getStatusCode } from "../shared/http";

type RateLimitConfig = {
  maxRequests: number; // 最大リクエスト数
  windowMs: number; // 時間ウィンドウ（ミリ秒）
  keyPrefix?: string; // KVキーのプレフィックス
};

type RateLimitBindings = {
  RATE_LIMIT_KV?: KVNamespace;
};

type RateLimitVariables = {
  userId: string;
};

/**
 * レート制限ミドルウェア
 * Cloudflare Workers KV を使用してユーザーごとのレート制限を実装
 *
 * @param config - レート制限の設定
 * @returns Hono ミドルウェア
 */
export const createRateLimitMiddleware = (
  config: RateLimitConfig
): MiddlewareHandler<{
  Bindings: RateLimitBindings;
  Variables: RateLimitVariables;
}> => {
  const { maxRequests, windowMs, keyPrefix = "rate_limit" } = config;

  return async (c, next) => {
    const kv = c.env.RATE_LIMIT_KV;

    // KVが設定されていない場合はスキップ（開発環境向け）
    if (!kv) {
      await next();
      return;
    }

    const userId = c.get("userId");
    if (!userId) {
      // userIdがない場合は認証エラーなので、authMiddlewareで処理される
      await next();
      return;
    }

    const key = `${keyPrefix}:${userId}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // 現在のレート制限データを取得
    const data = await kv.get<{ requests: number[] }>(key, "json");

    // 有効なリクエストのみをフィルタリング（時間ウィンドウ内のリクエスト）
    const validRequests = data?.requests.filter((ts) => ts > windowStart) || [];

    // レート制限チェック
    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));
      c.header("Retry-After", String(retryAfter));

      const error = createTooManyRequestsError(
        `レート制限を超えました。${retryAfter}秒後に再試行してください。`
      );
      return c.json(error, getStatusCode(error.code));
    }

    // 新しいリクエストを追加
    validRequests.push(now);

    // KVに保存（TTLを設定してウィンドウ期間後に自動削除）
    await kv.put(key, JSON.stringify({ requests: validRequests }), {
      expirationTtl: Math.ceil(windowMs / 1000),
    });

    // レート制限ヘッダーを設定
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(maxRequests - validRequests.length));

    await next();
  };
};

/**
 * AI エンドポイント用のレート制限設定
 * 1時間あたり1000リクエスト
 */
export const aiRateLimitMiddleware = createRateLimitMiddleware({
  maxRequests: 1000,
  windowMs: 60 * 60 * 1000, // 1時間
  keyPrefix: "ai_rate_limit",
});

/**
 * IPアドレスベースのレート制限ミドルウェア
 * 認証前のエンドポイント（/auth/google, /auth/refresh, /auth/logout）向け
 */
export const createIpRateLimitMiddleware = (
  config: RateLimitConfig
): MiddlewareHandler<{
  Bindings: RateLimitBindings;
}> => {
  const { maxRequests, windowMs, keyPrefix = "ip_rate_limit" } = config;

  return async (c, next) => {
    const kv = c.env.RATE_LIMIT_KV;

    // KVが設定されていない場合はスキップ（開発環境向け）
    if (!kv) {
      await next();
      return;
    }

    // Cloudflare WorkersではCF-Connecting-IPヘッダーでクライアントIPを取得
    const clientIp =
      c.req.header("CF-Connecting-IP") ||
      c.req.header("X-Forwarded-For")?.split(",")[0]?.trim() ||
      "unknown";

    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    // 現在のレート制限データを取得
    const data = await kv.get<{ requests: number[] }>(key, "json");

    // 有効なリクエストのみをフィルタリング（時間ウィンドウ内のリクエスト）
    const validRequests = data?.requests.filter((ts) => ts > windowStart) || [];

    // レート制限チェック
    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = oldestRequest + windowMs;
      const retryAfter = Math.ceil((resetTime - now) / 1000);

      c.header("X-RateLimit-Limit", String(maxRequests));
      c.header("X-RateLimit-Remaining", "0");
      c.header("X-RateLimit-Reset", String(Math.ceil(resetTime / 1000)));
      c.header("Retry-After", String(retryAfter));

      const error = createTooManyRequestsError(
        `レート制限を超えました。${retryAfter}秒後に再試行してください。`
      );
      return c.json(error, getStatusCode(error.code));
    }

    // 新しいリクエストを追加
    validRequests.push(now);

    // KVに保存（TTLを設定してウィンドウ期間後に自動削除）
    await kv.put(key, JSON.stringify({ requests: validRequests }), {
      expirationTtl: Math.ceil(windowMs / 1000),
    });

    // レート制限ヘッダーを設定
    c.header("X-RateLimit-Limit", String(maxRequests));
    c.header("X-RateLimit-Remaining", String(maxRequests - validRequests.length));

    await next();
  };
};

/**
 * 認証エンドポイント用のレート制限設定
 * 1分間に10リクエスト（IPアドレスベース）
 */
export const authRateLimitMiddleware = createIpRateLimitMiddleware({
  maxRequests: 10,
  windowMs: 60 * 1000, // 1分
  keyPrefix: "auth_rate_limit",
});
