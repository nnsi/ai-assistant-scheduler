import { eq, and } from "drizzle-orm";
import type { Database } from "./client";
import { categories, type CategoryRow } from "./schema";
import type { CategoryRepo } from "../../domain/infra/categoryRepo";
import type { CategoryEntity } from "../../domain/model/category";

export const createCategoryRepo = (db: Database): CategoryRepo => ({
  findAllByUserId: async (userId) => {
    const rows = await db
      .select()
      .from(categories)
      .where(eq(categories.userId, userId))
      .orderBy(categories.name);
    return rows.map(toCategory);
  },

  findById: async (id) => {
    const rows = await db.select().from(categories).where(eq(categories.id, id));
    return rows[0] ? toCategory(rows[0]) : null;
  },

  findByIdAndUserId: async (id, userId) => {
    const rows = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, id), eq(categories.userId, userId)));
    return rows[0] ? toCategory(rows[0]) : null;
  },

  save: async (category) => {
    await db.insert(categories).values(toRow(category));
  },

  update: async (category) => {
    await db
      .update(categories)
      .set(toRow(category))
      .where(eq(categories.id, category.id));
  },

  delete: async (id) => {
    await db.delete(categories).where(eq(categories.id, id));
  },
});

// Row → Entity 変換
const toCategory = (row: CategoryRow): CategoryEntity => ({
  id: row.id,
  userId: row.userId,
  calendarId: row.calendarId,
  name: row.name,
  color: row.color,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

// Entity → Row 変換
const toRow = (category: CategoryEntity): CategoryRow => ({
  id: category.id,
  userId: category.userId,
  calendarId: category.calendarId,
  name: category.name,
  color: category.color,
  createdAt: category.createdAt,
  updatedAt: category.updatedAt,
});
