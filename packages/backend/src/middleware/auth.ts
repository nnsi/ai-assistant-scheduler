import { createMiddleware } from "hono/factory";
import { createJwtService } from "../infra/auth/jwt";
import { createUnauthorizedError } from "../shared/errors";

type Bindings = {
  JWT_SECRET: string;
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
