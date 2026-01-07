import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  picture: text("picture"),
  provider: text("provider").notNull(), // "google" | "github" | "microsoft" etc.
  providerId: text("provider_id").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  startAt: text("start_at").notNull(),
  endAt: text("end_at"),
  isAllDay: integer("is_all_day", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const scheduleSupplements = sqliteTable("schedule_supplements", {
  id: text("id").primaryKey(),
  scheduleId: text("schedule_id")
    .notNull()
    .references(() => schedules.id, { onDelete: "cascade" }),
  keywords: text("keywords"), // JSON array
  aiResult: text("ai_result"),
  shopCandidates: text("shop_candidates"), // JSON array of shop objects
  selectedShop: text("selected_shop"), // JSON object of selected shop
  userMemo: text("user_memo"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const refreshTokens = sqliteTable("refresh_tokens", {
  id: text("id").primaryKey(), // jti として使用
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull(),
  revokedAt: text("revoked_at"), // null = 有効, 値あり = 失効
});

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  requiredConditions: text("required_conditions"), // JSON array: 必須条件
  preferredConditions: text("preferred_conditions"), // JSON array: 優先条件
  subjectiveConditions: text("subjective_conditions"), // JSON array: 主観条件
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 型エクスポート
export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type CategoryRow = typeof categories.$inferSelect;
export type CategoryInsert = typeof categories.$inferInsert;
export type ScheduleRow = typeof schedules.$inferSelect;
export type ScheduleInsert = typeof schedules.$inferInsert;
export type SupplementRow = typeof scheduleSupplements.$inferSelect;
export type SupplementInsert = typeof scheduleSupplements.$inferInsert;
export type RefreshTokenRow = typeof refreshTokens.$inferSelect;
export type RefreshTokenInsert = typeof refreshTokens.$inferInsert;
export type UserProfileRow = typeof userProfiles.$inferSelect;
export type UserProfileInsert = typeof userProfiles.$inferInsert;
