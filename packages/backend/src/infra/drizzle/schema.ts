import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const schedules = sqliteTable("schedules", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  startAt: text("start_at").notNull(),
  endAt: text("end_at"),
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
  userMemo: text("user_memo"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 型エクスポート
export type ScheduleRow = typeof schedules.$inferSelect;
export type ScheduleInsert = typeof schedules.$inferInsert;
export type SupplementRow = typeof scheduleSupplements.$inferSelect;
export type SupplementInsert = typeof scheduleSupplements.$inferInsert;
