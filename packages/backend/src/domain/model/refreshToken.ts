import { nanoid } from "nanoid";

export type RefreshTokenEntity = {
  id: string; // jti として使用
  userId: string;
  expiresAt: string;
  createdAt: string;
  revokedAt: string | null;
};

export const createRefreshToken = (userId: string, expiresAt: Date): RefreshTokenEntity => {
  const now = new Date().toISOString();
  return {
    id: nanoid(),
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: now,
    revokedAt: null,
  };
};

export const isTokenValid = (token: RefreshTokenEntity): boolean => {
  // 失効していないかチェック
  if (token.revokedAt !== null) {
    return false;
  }
  // 有効期限チェック
  const expiresAt = new Date(token.expiresAt);
  return expiresAt > new Date();
};

export const revokeToken = (token: RefreshTokenEntity): RefreshTokenEntity => ({
  ...token,
  revokedAt: new Date().toISOString(),
});
