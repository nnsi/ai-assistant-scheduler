import { sign, verify } from "hono/jwt";
import type { UserEntity } from "../../domain/model/user";

export type JwtPayload = {
  sub: string; // user id
  email: string;
  exp: number;
  type: "access" | "refresh";
};

const ACCESS_TOKEN_EXPIRY_SECONDS = 60 * 60; // 1時間
const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30日間

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

    // リフレッシュトークン生成
    generateRefreshToken: async (user: UserEntity): Promise<string> => {
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + REFRESH_TOKEN_EXPIRY_SECONDS,
        type: "refresh",
      };
      return sign(payload, secret);
    },

    // 両方のトークンを生成
    generateTokens: async (
      user: UserEntity
    ): Promise<{ accessToken: string; refreshToken: string }> => {
      const [accessToken, refreshToken] = await Promise.all([
        service.generateAccessToken(user),
        service.generateRefreshToken(user),
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
