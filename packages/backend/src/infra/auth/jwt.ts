import { sign, verify } from "hono/jwt";
import type { UserEntity } from "../../domain/model/user";

export type JwtPayload = {
  sub: string; // user id
  email: string;
  exp: number;
};

const TOKEN_EXPIRY_SECONDS = 7 * 24 * 60 * 60; // 7日間

export const createJwtService = (secret: string) => ({
  // トークン生成
  generateToken: async (user: UserEntity): Promise<string> => {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY_SECONDS,
    };
    return sign(payload, secret);
  },

  // トークン検証
  verifyToken: async (token: string): Promise<JwtPayload | null> => {
    try {
      const payload = await verify(token, secret);
      return payload as JwtPayload;
    } catch {
      return null;
    }
  },
});

export type JwtService = ReturnType<typeof createJwtService>;
