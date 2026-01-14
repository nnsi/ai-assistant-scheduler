import {
  googleAuthCallbackSchema,
  reconnectGoogleSchema,
  updateEmailSchema,
} from "@ai-scheduler/shared";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { createCalendar } from "../../domain/model/calendar";
import { createRefreshToken } from "../../domain/model/refreshToken";
import type { UserEntity } from "../../domain/model/user";
import { createGoogleAuthService } from "../../infra/auth/google";
import { REFRESH_TOKEN_EXPIRY_SECONDS, createJwtService } from "../../infra/auth/jwt";
import { createCalendarRepo } from "../../infra/drizzle/calendarRepo";
import { createDb } from "../../infra/drizzle/client";
import { createRefreshTokenRepo } from "../../infra/drizzle/refreshTokenRepo";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { authRateLimitMiddleware } from "../../middleware/rateLimit";
import {
  createNotFoundError,
  createUnauthorizedError,
  createValidationError,
} from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { validateRedirectUri } from "../../shared/redirectUri";
import { createGetCurrentUserUseCase } from "./usecase/getCurrentUser";
import { createLogoutUseCase } from "./usecase/logout";
import { createOAuthAuthUseCase } from "./usecase/oauthAuth";
import { createReconnectOAuthUseCase } from "./usecase/reconnectOAuth";
import { createRefreshTokenUseCase } from "./usecase/refreshToken";
import { createUpdateEmailUseCase } from "./usecase/updateEmail";

// 開発環境テストユーザー設定
const DEV_USER = {
  id: "dev-user-001",
  email: "dev@example.com",
  name: "開発テストユーザー",
  picture: null,
  provider: "google" as const,
  providerId: "dev-provider-001",
};

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  ALLOWED_REDIRECT_URIS?: string;
  RATE_LIMIT_KV?: KVNamespace;
  FRONTEND_URL?: string;
  ENABLE_DEV_AUTH?: string;
};

// リフレッシュトークン用Cookie設定
const REFRESH_TOKEN_COOKIE = "refresh_token";
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60; // 30日

type Variables = {
  googleAuth: ReturnType<typeof createOAuthAuthUseCase>;
  getCurrentUser: ReturnType<typeof createGetCurrentUserUseCase>;
  refreshToken: ReturnType<typeof createRefreshTokenUseCase>;
  logout: ReturnType<typeof createLogoutUseCase>;
  updateEmail: ReturnType<typeof createUpdateEmailUseCase>;
  reconnectGoogle: ReturnType<typeof createReconnectOAuthUseCase>;
  jwtService: ReturnType<typeof createJwtService>;
};

const app = new Hono<{
  Bindings: Bindings;
  Variables: Variables;
}>();

// ミドルウェアでDIを解決
app.use("*", async (c, next) => {
  const db = createDb(c.env.DB);
  const userRepo = createUserRepo(db);
  const refreshTokenRepo = createRefreshTokenRepo(db);
  const calendarRepo = createCalendarRepo(db);
  const googleAuthService = createGoogleAuthService(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET
  );
  const jwtService = createJwtService(c.env.JWT_SECRET);

  c.set(
    "googleAuth",
    createOAuthAuthUseCase(userRepo, refreshTokenRepo, calendarRepo, googleAuthService, jwtService)
  );
  c.set("getCurrentUser", createGetCurrentUserUseCase(userRepo));
  c.set("refreshToken", createRefreshTokenUseCase(userRepo, refreshTokenRepo, jwtService));
  c.set("logout", createLogoutUseCase(refreshTokenRepo, jwtService));
  c.set("updateEmail", createUpdateEmailUseCase(userRepo));
  c.set("reconnectGoogle", createReconnectOAuthUseCase(userRepo, googleAuthService));
  c.set("jwtService", jwtService);

  await next();
});

// 認証エンドポイントにレート制限を適用
app.post("/google", authRateLimitMiddleware);
app.post("/refresh", authRateLimitMiddleware);
app.post("/logout", authRateLimitMiddleware);

export const authRoute = app
  // POST /auth/google - Google OAuth コールバック処理
  .post(
    "/google",
    zValidator("json", googleAuthCallbackSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { code, redirectUri } = c.req.valid("json");

      // リダイレクトURI検証
      const uriValidation = validateRedirectUri(redirectUri, c.env.ALLOWED_REDIRECT_URIS);
      if (!uriValidation.ok) {
        return c.json(uriValidation.error, getStatusCode(uriValidation.error.code));
      }

      const result = await c.get("googleAuth")(code, redirectUri);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      // リフレッシュトークンをHttpOnly Cookieで設定
      const isProduction = c.env.FRONTEND_URL?.startsWith("https://");
      setCookie(c, REFRESH_TOKEN_COOKIE, result.value.refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: "Strict",
        path: "/api/auth",
        maxAge: REFRESH_TOKEN_MAX_AGE,
      });

      // レスポンスにはアクセストークンとユーザー情報のみ返す（リフレッシュトークンは除外）
      return c.json(
        {
          accessToken: result.value.accessToken,
          user: result.value.user,
        },
        200
      );
    }
  )
  // GET /auth/me - 現在のユーザー情報を取得
  .get("/me", async (c) => {
    // Authorizationヘッダーからトークンを取得
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json(createUnauthorizedError(), 401);
    }

    const token = authHeader.substring(7);
    const jwtService = c.get("jwtService");
    const payload = await jwtService.verifyAccessToken(token);

    if (!payload) {
      return c.json(createUnauthorizedError("無効なトークンです"), 401);
    }

    const result = await c.get("getCurrentUser")(payload.sub);

    if (!result.ok) {
      return c.json(result.error, getStatusCode(result.error.code));
    }

    return c.json({ user: result.value }, 200);
  })
  // POST /auth/refresh - トークンリフレッシュ
  .post("/refresh", async (c) => {
    // Cookieまたはリクエストボディからリフレッシュトークンを取得（後方互換性のため両方サポート）
    let refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE);

    // Cookieにない場合はリクエストボディを確認（後方互換性）
    if (!refreshToken) {
      try {
        const body = await c.req.json();
        if (body && typeof body.refreshToken === "string") {
          refreshToken = body.refreshToken;
        }
      } catch {
        // JSONパースエラーは無視
      }
    }

    if (!refreshToken) {
      return c.json(createUnauthorizedError("リフレッシュトークンがありません"), 401);
    }

    const result = await c.get("refreshToken")(refreshToken);

    if (!result.ok) {
      // リフレッシュに失敗した場合はCookieを削除
      deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: "/api/auth" });
      return c.json(result.error, getStatusCode(result.error.code));
    }

    // 新しいリフレッシュトークンをHttpOnly Cookieで設定
    const isProduction = c.env.FRONTEND_URL?.startsWith("https://");
    setCookie(c, REFRESH_TOKEN_COOKIE, result.value.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Strict",
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    // レスポンスにはアクセストークンのみ返す
    return c.json(
      {
        accessToken: result.value.accessToken,
      },
      200
    );
  })
  // POST /auth/logout - ログアウト（リフレッシュトークンを無効化）
  .post("/logout", async (c) => {
    // Cookieまたはリクエストボディからリフレッシュトークンを取得
    let refreshToken = getCookie(c, REFRESH_TOKEN_COOKIE);

    // Cookieにない場合はリクエストボディを確認（後方互換性）
    if (!refreshToken) {
      try {
        const body = await c.req.json();
        if (body && typeof body.refreshToken === "string") {
          refreshToken = body.refreshToken;
        }
      } catch {
        // JSONパースエラーは無視
      }
    }

    // リフレッシュトークンがある場合のみサーバーで無効化
    if (refreshToken) {
      await c.get("logout")(refreshToken);
    }

    // Cookieを削除（リフレッシュトークンの有無に関わらず）
    deleteCookie(c, REFRESH_TOKEN_COOKIE, { path: "/api/auth" });

    return c.json({ message: "ログアウトしました" }, 200);
  })
  // PUT /auth/email - メールアドレス更新
  .put(
    "/email",
    zValidator("json", updateEmailSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      // 認証チェック
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(createUnauthorizedError(), 401);
      }

      const token = authHeader.substring(7);
      const jwtService = c.get("jwtService");
      const payload = await jwtService.verifyAccessToken(token);

      if (!payload) {
        return c.json(createUnauthorizedError("無効なトークンです"), 401);
      }

      const { email } = c.req.valid("json");
      const result = await c.get("updateEmail")(payload.sub, email);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({ user: result.value }, 200);
    }
  )
  // POST /auth/reconnect-google - Google認証再設定
  .post(
    "/reconnect-google",
    zValidator("json", reconnectGoogleSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      // 認証チェック
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json(createUnauthorizedError(), 401);
      }

      const token = authHeader.substring(7);
      const jwtService = c.get("jwtService");
      const payload = await jwtService.verifyAccessToken(token);

      if (!payload) {
        return c.json(createUnauthorizedError("無効なトークンです"), 401);
      }

      const { code, redirectUri } = c.req.valid("json");

      // リダイレクトURI検証
      const uriValidation = validateRedirectUri(redirectUri, c.env.ALLOWED_REDIRECT_URIS);
      if (!uriValidation.ok) {
        return c.json(uriValidation.error, getStatusCode(uriValidation.error.code));
      }

      const result = await c.get("reconnectGoogle")(payload.sub, code, redirectUri);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json({ user: result.value }, 200);
    }
  )
  // POST /auth/dev-login - 開発環境用ログイン（Google認証をバイパス）
  .post("/dev-login", async (c) => {
    // 開発環境認証が無効な場合は404を返す
    if (c.env.ENABLE_DEV_AUTH !== "true") {
      return c.json(createNotFoundError("エンドポイント"), 404);
    }

    const db = createDb(c.env.DB);
    const userRepo = createUserRepo(db);
    const refreshTokenRepo = createRefreshTokenRepo(db);
    const calendarRepo = createCalendarRepo(db);
    const jwtService = c.get("jwtService");

    // テストユーザーを検索または作成
    let user = await userRepo.findByProviderId(DEV_USER.provider, DEV_USER.providerId);

    if (!user) {
      const now = new Date().toISOString();
      const newUser: UserEntity = {
        ...DEV_USER,
        createdAt: now,
        updatedAt: now,
      };
      await userRepo.save(newUser);
      user = newUser;

      // デフォルトカレンダーを作成
      const defaultCalendar = createCalendar({ name: "マイカレンダー", color: "#3B82F6" }, user.id);
      await calendarRepo.create(defaultCalendar);
    }

    // リフレッシュトークンをDBに保存
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_SECONDS * 1000);
    const refreshTokenEntity = createRefreshToken(user.id, expiresAt);
    await refreshTokenRepo.save(refreshTokenEntity);

    // JWTトークンを生成
    const tokens = await jwtService.generateTokens(user, refreshTokenEntity.id);

    // リフレッシュトークンをHttpOnly Cookieで設定
    const isProduction = c.env.FRONTEND_URL?.startsWith("https://");
    setCookie(c, REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "Strict",
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    return c.json(
      {
        accessToken: tokens.accessToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
        },
      },
      200
    );
  });
