import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { googleAuthCallbackSchema, refreshTokenSchema } from "@ai-scheduler/shared";
import { createDb } from "../../infra/drizzle/client";
import { createUserRepo } from "../../infra/drizzle/userRepo";
import { createGoogleAuthService } from "../../infra/auth/google";
import { createJwtService } from "../../infra/auth/jwt";
import { createGoogleAuthUseCase } from "./usecase/googleAuth";
import { createGetCurrentUserUseCase } from "./usecase/getCurrentUser";
import { createRefreshTokenUseCase } from "./usecase/refreshToken";
import { createValidationError, createUnauthorizedError } from "../../shared/errors";
import { getStatusCode } from "../../shared/http";

type Bindings = {
  DB: D1Database;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
};

type Variables = {
  googleAuth: ReturnType<typeof createGoogleAuthUseCase>;
  getCurrentUser: ReturnType<typeof createGetCurrentUserUseCase>;
  refreshToken: ReturnType<typeof createRefreshTokenUseCase>;
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
  const googleAuthService = createGoogleAuthService(
    c.env.GOOGLE_CLIENT_ID,
    c.env.GOOGLE_CLIENT_SECRET
  );
  const jwtService = createJwtService(c.env.JWT_SECRET);

  c.set("googleAuth", createGoogleAuthUseCase(userRepo, googleAuthService, jwtService));
  c.set("getCurrentUser", createGetCurrentUserUseCase(userRepo));
  c.set("refreshToken", createRefreshTokenUseCase(userRepo, jwtService));
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
  // POST /auth/logout - ログアウト（クライアント側でトークンを削除）
  .post("/logout", async (c) => {
    // JWTはステートレスなので、サーバー側では特に処理なし
    // クライアント側でトークンを削除する
    return c.json({ success: true }, 200);
  });
