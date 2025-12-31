import { eq } from "drizzle-orm";
import type { Database } from "./client";
import { scheduleSupplements, type SupplementRow } from "./schema";
import type { SupplementRepo } from "../../domain/infra/supplementRepo";
import type { Supplement } from "../../domain/model/supplement";

export const createSupplementRepo = (db: Database): SupplementRepo => ({
  findByScheduleId: async (scheduleId) => {
    const rows = await db
      .select()
      .from(scheduleSupplements)
      .where(eq(scheduleSupplements.scheduleId, scheduleId));
    return rows[0] ? toSupplement(rows[0]) : null;
  },

  save: async (supplement) => {
    await db.insert(scheduleSupplements).values(toRow(supplement));
  },

  update: async (supplement) => {
    await db
      .update(scheduleSupplements)
      .set(toRow(supplement))
      .where(eq(scheduleSupplements.id, supplement.id));
  },

  delete: async (scheduleId) => {
    await db
      .delete(scheduleSupplements)
      .where(eq(scheduleSupplements.scheduleId, scheduleId));
  },
});

// JSON文字列を安全にパースする
const safeParseJsonArray = (jsonString: string | null): string[] => {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.error("Failed to parse keywords JSON:", jsonString);
    return [];
  }
};

// Row → Entity 変換
const toSupplement = (row: SupplementRow): Supplement => ({
  id: row.id,
  scheduleId: row.scheduleId,
  keywords: safeParseJsonArray(row.keywords),
  aiResult: row.aiResult,
  userMemo: row.userMemo,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (supplement: Supplement): SupplementRow => ({
  id: supplement.id,
  scheduleId: supplement.scheduleId,
  keywords: JSON.stringify(supplement.keywords),
  aiResult: supplement.aiResult,
  userMemo: supplement.userMemo,
  createdAt: supplement.createdAt,
  updatedAt: supplement.updatedAt,
});
