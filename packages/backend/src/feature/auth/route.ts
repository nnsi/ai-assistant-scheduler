import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  googleAuthCallbackSchema,
  refreshTokenSchema,
  logoutSchema,
  updateEmailSchema,
  reconnectGoogleSchema,
} from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createRefreshTokenRepo } from "../../infra/drizzle/refreshTokenRepo";
import { createGoogleAuthService } from "../../infra/auth/google";
import { createJwtService } from "../../infra/auth/jwt";
import { createOAuthAuthUseCase } from "./usecase/oauthAuth";
import { createGetCurrentUserUseCase } from "./usecase/getCurrentUser";
import { createRefreshTokenUseCase } from "./usecase/refreshToken";
import { createLogoutUseCase } from "./usecase/logout";
import { createUpdateEmailUseCase } from "./usecase/updateEmail";
import { createReconnectOAuthUseCase } from "./usecase/reconnectOAuth";
import { createValidationError, createUnauthorizedError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";
import { validateRedirectUri } from "../../shared/redirectUri";

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
  ALLOWED_REDIRECT_URIS?: string;
};

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
  const googleAuthService = createGoogleAuthService(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET
  );
  const jwtService = createJwtService(c.env.JWT_SECRET);

  c.set(
    "googleAuth",
    createOAuthAuthUseCase(userRepo, refreshTokenRepo, googleAuthService, jwtService)
  );
  c.set("getCurrentUser", createGetCurrentUserUseCase(userRepo));
  c.set("refreshToken", createRefreshTokenUseCase(userRepo, refreshTokenRepo, jwtService));
  c.set("logout", createLogoutUseCase(refreshTokenRepo, jwtService));
  c.set("updateEmail", createUpdateEmailUseCase(userRepo));
  c.set("reconnectGoogle", createReconnectOAuthUseCase(userRepo, googleAuthService));
  c.set("jwtService", jwtService);

  await next();
});

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

      return c.json(result.value, 200);
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
  .post(
    "/refresh",
    zValidator("json", refreshTokenSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { refreshToken } = c.req.valid("json");
      const result = await c.get("refreshToken")(refreshToken);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
  // POST /auth/logout - ログアウト（リフレッシュトークンを無効化）
  .post(
    "/logout",
    zValidator("json", logoutSchema, (result, c) => {
      if (!result.success) {
        return c.json(createValidationError(result.error), 400);
      }
    }),
    async (c) => {
      const { refreshToken } = c.req.valid("json");
      const result = await c.get("logout")(refreshToken);

      if (!result.ok) {
        return c.json(result.error, getStatusCode(result.error.code));
      }

      return c.json(result.value, 200);
    }
  )
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
  );
