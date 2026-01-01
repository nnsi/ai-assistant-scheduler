import { eq, and } from "drizzle-orm";
import type { Database } from "./client";
import { users, type UserRow } from "./schema";
import type { UserRepo } from "../../domain/infra/userRepo";
import type { UserEntity } from "../../domain/model/user";
import type { OAuthProviderType } from "../auth/oauth";

export const createUserRepo = (db: Database): UserRepo => ({
  findById: async (id) => {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] ? toUser(rows[0]) : null;
  },

  findByProviderId: async (provider, providerId) => {
    const rows = await db
      .select()
      .from(users)
      .where(and(eq(users.provider, provider), eq(users.providerId, providerId)));
    return rows[0] ? toUser(rows[0]) : null;
  },

  findByEmail: async (email) => {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows[0] ? toUser(rows[0]) : null;
  },

  save: async (user) => {
    await db.insert(users).values(toRow(user));
  },

  update: async (user) => {
    await db.update(users).set(toRow(user)).where(eq(users.id, user.id));
  },
});

// Row → Entity 変換
const toUser = (row: UserRow): UserEntity => ({
  id: row.id,
  email: row.email,
  name: row.name,
  picture: row.picture,
  provider: row.provider as OAuthProviderType,
  providerId: row.providerId,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (user: UserEntity): UserRow => ({
  id: user.id,
  email: user.email,
  name: user.name,
  picture: user.picture,
  provider: user.provider,
  providerId: user.providerId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});
