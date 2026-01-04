import { createMiddleware } from "hono/factory";
import { createJwtService } from "../infra/auth/jwt";
import { createUnauthorizedError } from "../shared/errors";

// 開発環境テストユーザー設定（route.tsと同じ値）
const DEV_USER = {
  id: "dev-user-001",
  email: "dev@example.com",
};

type Bindings = {
  JWT_SECRET: string;
  ENABLE_DEV_AUTH?: string;
};

type Variables = {
  userId: string;
  userEmail: string;
};

// 認証必須ミドルウェア（アクセストークンのみ許可）
export const authMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Variables;
}>(async (c, next) => {
  // 開発環境認証バイパス: X-Dev-Auth ヘッダーが "true" の場合
  const devAuthHeader = c.req.header("X-Dev-Auth");
  if (c.env.ENABLE_DEV_AUTH === "true" && devAuthHeader === "true") {
    c.set("userId", DEV_USER.id);
    c.set("userEmail", DEV_USER.email);
    await next();
    return;
  }

  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(createUnauthorizedError(), 401);
  }

  const token = authHeader.substring(7);
  const jwtService = createJwtService(c.env.JWT_SECRET);
  const payload = await jwtService.verifyAccessToken(token);

  if (!payload) {
    return c.json(createUnauthorizedError("無効なトークンです"), 401);
  }

  // ユーザー情報をコンテキストに設定
  c.set("userId", payload.sub);
  c.set("userEmail", payload.email);

  await next();
});

// オプショナル認証ミドルウェア（認証なしでもアクセス可能）
export const optionalAuthMiddleware = createMiddleware<{
  Bindings: Bindings;
  Variables: Partial<Variables>;
}>(async (c, next) => {
  // 開発環境認証バイパス: X-Dev-Auth ヘッダーが "true" の場合
  const devAuthHeader = c.req.header("X-Dev-Auth");
  if (c.env.ENABLE_DEV_AUTH === "true" && devAuthHeader === "true") {
    c.set("userId", DEV_USER.id);
    c.set("userEmail", DEV_USER.email);
    await next();
    return;
  }

  const authHeader = c.req.header("Authorization");

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    const jwtService = createJwtService(c.env.JWT_SECRET);
    const payload = await jwtService.verifyAccessToken(token);

    if (payload) {
      c.set("userId", payload.sub);
      c.set("userEmail", payload.email);
    }
  }

  await next();
});
