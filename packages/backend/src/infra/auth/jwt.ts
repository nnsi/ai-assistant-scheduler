import { sign, verify } from "hono/jwt";
import type { UserEntity } from "../../domain/model/user";

export type JwtPayload = {
  sub: string; // user id
  email: string;
  exp: number;
  type: "access" | "refresh";
  jti?: string; // JWT ID (リフレッシュトークン用)
};

export const ACCESS_TOKEN_EXPIRY_SECONDS = 60 * 60; // 1時間
export const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30日間

export const createJwtService = (secret: string) => {
  const service = {
    // アクセストークン生成
    generateAccessToken: async (user: UserEntity): Promise<string> => {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + ACCESS_TOKEN_EXPIRY_SECONDS,
        type: "access",
      };
      return sign(payload, secret);
    },

    // リフレッシュトークン生成 (jtiを外部から受け取る)
    generateRefreshToken: async (user: UserEntity, jti: string): Promise<string> => {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY_SECONDS,
        type: "refresh",
        jti,
      };
      return sign(payload, secret);
    },

    // 両方のトークンを生成 (リフレッシュトークン用のjtiを外部から受け取る)
    generateTokens: async (
      user: UserEntity,
      refreshTokenId: string
    ): Promise<{ accessToken: string; refreshToken: string }> => {
      const [accessToken, refreshToken] = await Promise.all([
        service.generateAccessToken(user),
        service.generateRefreshToken(user, refreshTokenId),
      ]);
      return { accessToken, refreshToken };
    },

    // トークン検証（type問わず）
    verifyToken: async (token: string): Promise<JwtPayload | null> => {
      try {
        const payload = await verify(token, secret);
        return payload as JwtPayload;
      } catch {
        return null;
      }
    },

    // アクセストークン検証（type: accessのみ許可）
    verifyAccessToken: async (token: string): Promise<JwtPayload | null> => {
      try {
        const payload = (await verify(token, secret)) as JwtPayload;
        if (payload.type !== "access") {
          return null;
        }
        return payload;
      } catch {
        return null;
      }
    },

    // リフレッシュトークン検証（type: refreshのみ許可）
    verifyRefreshToken: async (token: string): Promise<JwtPayload | null> => {
      try {
        const payload = (await verify(token, secret)) as JwtPayload;
        if (payload.type !== "refresh") {
          return null;
        }
        return payload;
      } catch {
        return null;
      }
    },
  };

  return service;
};

export type JwtService = ReturnType<typeof createJwtService>;
