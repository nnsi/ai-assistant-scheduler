import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { userProfiles, type UserProfileRow } from "./schema";
import type { ProfileRepo } from "../../domain/infra/profileRepo";
import type { ProfileEntity } from "../../domain/model/profile";

export const createProfileRepo = (db: Database): ProfileRepo => ({
  findByUserId: async (userId) => {
    const rows = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, userId));
    return rows[0] ? toEntity(rows[0]) : null;
  },

  save: async (profile) => {
    await db.insert(userProfiles).values(toRow(profile));
  },

  update: async (profile) => {
    await db
      .update(userProfiles)
      .set(toRow(profile))
      .where(eq(userProfiles.id, profile.id));
  },
});

// Row → Entity 変換（文字列をそのまま使用）
const toEntity = (row: UserProfileRow): ProfileEntity => ({
  id: row.id,
  userId: row.userId,
  requiredConditions: row.requiredConditions ?? "",
  preferredConditions: row.preferredConditions ?? "",
  subjectiveConditions: row.subjectiveConditions ?? "",
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (entity: ProfileEntity): UserProfileRow => ({
  id: entity.id,
  userId: entity.userId,
  requiredConditions: entity.requiredConditions,
  preferredConditions: entity.preferredConditions,
  subjectiveConditions: entity.subjectiveConditions,
  createdAt: entity.createdAt,
  updatedAt: entity.updatedAt,
});
