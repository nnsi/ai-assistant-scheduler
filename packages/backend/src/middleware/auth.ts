import { createMiddleware } from "hono/factory";
import { createJwtService, type JwtPayload } from "../infra/auth/jwt";
import { createUnauthorizedError } from "../shared/errors";

type Bindings = {
  JWT_SECRET: string;
};

type Variables = {
  userId: string;
  userEmail: string;
};

// 認証必須ミドルウェア
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
  const payload = await jwtService.verifyToken(token);

  if (!payload) {
    return c.json(createUnauthorizedError("無効なトークンです"), 401);
  }

  // トークンの有効期限チェック
  if (payload.exp < Math.floor(Date.now() / 1000)) {
    return c.json(createUnauthorizedError("トークンの有効期限が切れています"), 401);
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
    const payload = await jwtService.verifyToken(token);

    if (payload && payload.exp >= Math.floor(Date.now() / 1000)) {
      c.set("userId", payload.sub);
      c.set("userEmail", payload.email);
    }
  }

  await next();
});
