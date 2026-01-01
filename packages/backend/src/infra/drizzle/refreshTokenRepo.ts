import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { refreshTokens, type RefreshTokenRow } from "./schema";
import type { RefreshTokenRepo } from "../../domain/infra/refreshTokenRepo";
import type { RefreshTokenEntity } from "../../domain/model/refreshToken";

export const createRefreshTokenRepo = (db: Database): RefreshTokenRepo => ({
  findById: async (id) => {
    const rows = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.id, id));
    return rows[0] ? toEntity(rows[0]) : null;
  },

  save: async (token) => {
    await db.insert(refreshTokens).values(toRow(token));
  },

  revoke: async (id) => {
    const now = new Date().toISOString();
    await db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.id, id));
  },

  revokeAllByUserId: async (userId) => {
    const now = new Date().toISOString();
    await db
      .update(refreshTokens)
      .set({ revokedAt: now })
      .where(eq(refreshTokens.userId, userId));
  },
});

const toEntity = (row: RefreshTokenRow): RefreshTokenEntity => ({
  id: row.id,
  userId: row.userId,
  expiresAt: row.expiresAt,
  createdAt: row.createdAt,
  revokedAt: row.revokedAt,
});

const toRow = (entity: RefreshTokenEntity): RefreshTokenRow => ({
  id: entity.id,
  userId: entity.userId,
  expiresAt: entity.expiresAt,
  createdAt: entity.createdAt,
  revokedAt: entity.revokedAt,
});
