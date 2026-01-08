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

// カレンダーテーブル
export const calendars = sqliteTable("calendars", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  deletedAt: text("deleted_at"), // NULL = active, 値あり = ソフトデリート済み
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// カレンダーメンバー（共有）テーブル
export const calendarMembers = sqliteTable("calendar_members", {
  id: text("id").primaryKey(),
  calendarId: text("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("viewer"), // 'viewer' | 'editor' | 'admin'
  invitedBy: text("invited_by").references(() => users.id),
  acceptedAt: text("accepted_at"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 招待リンクテーブル
export const calendarInvitations = sqliteTable("calendar_invitations", {
  id: text("id").primaryKey(),
  calendarId: text("calendar_id")
    .notNull()
    .references(() => calendars.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  role: text("role").notNull().default("viewer"), // 'viewer' | 'editor'
  expiresAt: text("expires_at").notNull(),
  maxUses: integer("max_uses"),
  useCount: integer("use_count").notNull().default(0),
  createdBy: text("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: text("created_at").notNull(),
});

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  calendarId: text("calendar_id").references(() => calendars.id, { onDelete: "cascade" }),
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
  calendarId: text("calendar_id").references(() => calendars.id, { onDelete: "cascade" }),
  createdBy: text("created_by").references(() => users.id),
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

export const recurrenceRules = sqliteTable("recurrence_rules", {
  id: text("id").primaryKey(),
  scheduleId: text("schedule_id")
    .notNull()
    .references(() => schedules.id, { onDelete: "cascade" }),
  frequency: text("frequency").notNull(), // 'daily', 'weekly', 'monthly', 'yearly'
  intervalValue: integer("interval_value").notNull().default(1), // 繰り返し間隔
  daysOfWeek: text("days_of_week"), // JSON array: ['MO','TU','WE','TH','FR','SA','SU']
  dayOfMonth: integer("day_of_month"), // 月の何日目か (1-31)
  weekOfMonth: integer("week_of_month"), // 月の第何週か (1-5, -1は最終週)
  endType: text("end_type").notNull().default("never"), // 'never', 'date', 'count'
  endDate: text("end_date"), // 終了日 (YYYY-MM-DD)
  endCount: integer("end_count"), // 終了回数
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

// 型エクスポート
export type UserRow = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type CalendarRow = typeof calendars.$inferSelect;
export type CalendarInsert = typeof calendars.$inferInsert;
export type CalendarMemberRow = typeof calendarMembers.$inferSelect;
export type CalendarMemberInsert = typeof calendarMembers.$inferInsert;
export type CalendarInvitationRow = typeof calendarInvitations.$inferSelect;
export type CalendarInvitationInsert = typeof calendarInvitations.$inferInsert;
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
export type RecurrenceRuleRow = typeof recurrenceRules.$inferSelect;
export type RecurrenceRuleInsert = typeof recurrenceRules.$inferInsert;
