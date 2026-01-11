import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../infra/drizzle/schema";

/**
 * テスト用DDL定義
 *
 * 重要: schema.tsを変更したら、このDDLも更新すること
 * スキーマとDDLの同期は generateDDL.ts で検証できる:
 *   npx tsx src/test/generateDDL.ts
 */
const TEST_DDL = `
  CREATE TABLE IF NOT EXISTS users (
    id text PRIMARY KEY NOT NULL,
    email text NOT NULL UNIQUE,
    name text NOT NULL,
    picture text,
    provider text NOT NULL,
    provider_id text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL
  );
  CREATE TABLE IF NOT EXISTS calendars (
    id text PRIMARY KEY NOT NULL,
    owner_id text NOT NULL,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    deleted_at text,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS calendar_members (
    id text PRIMARY KEY NOT NULL,
    calendar_id text NOT NULL,
    user_id text NOT NULL,
    role text NOT NULL DEFAULT 'viewer',
    invited_by text,
    accepted_at text,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (invited_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS calendar_invitations (
    id text PRIMARY KEY NOT NULL,
    calendar_id text NOT NULL,
    token text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'viewer',
    expires_at text NOT NULL,
    max_uses integer,
    use_count integer NOT NULL DEFAULT 0,
    created_by text NOT NULL,
    created_at text NOT NULL,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );
  CREATE TABLE IF NOT EXISTS categories (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    calendar_id text,
    name text NOT NULL,
    color text NOT NULL,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS schedules (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    calendar_id text,
    created_by text,
    category_id text,
    title text NOT NULL,
    start_at text NOT NULL,
    end_at text,
    is_all_day integer NOT NULL DEFAULT 0,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (calendar_id) REFERENCES calendars(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS schedule_supplements (
    id text PRIMARY KEY NOT NULL,
    schedule_id text NOT NULL,
    keywords text,
    agent_types text,
    ai_result text,
    shop_candidates text,
    selected_shops text,
    user_memo text,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS refresh_tokens (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL,
    expires_at text NOT NULL,
    created_at text NOT NULL,
    revoked_at text,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS user_profiles (
    id text PRIMARY KEY NOT NULL,
    user_id text NOT NULL UNIQUE,
    required_conditions text,
    preferred_conditions text,
    subjective_conditions text,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  CREATE TABLE IF NOT EXISTS recurrence_rules (
    id text PRIMARY KEY NOT NULL,
    schedule_id text NOT NULL,
    frequency text NOT NULL,
    interval_value integer NOT NULL DEFAULT 1,
    days_of_week text,
    day_of_month integer,
    week_of_month integer,
    end_type text NOT NULL DEFAULT 'never',
    end_date text,
    end_count integer,
    created_at text NOT NULL,
    updated_at text NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
  );
  CREATE INDEX IF NOT EXISTS idx_users_provider_id ON users (provider, provider_id);
  CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
  CREATE INDEX IF NOT EXISTS idx_calendars_owner_id ON calendars (owner_id);
  CREATE INDEX IF NOT EXISTS idx_calendar_members_calendar_id ON calendar_members (calendar_id);
  CREATE INDEX IF NOT EXISTS idx_calendar_members_user_id ON calendar_members (user_id);
  CREATE INDEX IF NOT EXISTS idx_calendar_invitations_token ON calendar_invitations (token);
  CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories (user_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules (user_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_calendar_id ON schedules (calendar_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_start_at ON schedules (start_at);
  CREATE INDEX IF NOT EXISTS idx_supplements_schedule_id ON schedule_supplements (schedule_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens (user_id);
  CREATE INDEX IF NOT EXISTS idx_refresh_tokens_revoked_at ON refresh_tokens (revoked_at);
  CREATE INDEX IF NOT EXISTS idx_recurrence_rules_schedule_id ON recurrence_rules (schedule_id);
`;

// テスト用のメモリDBを作成
export const createTestDb = () => {
  const sqlite = new Database(":memory:");

  // テーブルを作成
  sqlite.exec(TEST_DDL);

  // 外部キー制約を有効化
  sqlite.pragma("foreign_keys = ON");

  return drizzle(sqlite, { schema });
};

export type TestDb = BetterSQLite3Database<typeof schema>;

// テスト用のユーザーを作成
export const createTestUser = async (
  db: TestDb,
  data?: {
    id?: string;
    email?: string;
    name?: string;
    picture?: string;
    provider?: string;
    providerId?: string;
  }
) => {
  const now = new Date().toISOString();
  const user = {
    id: data?.id ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    email: data?.email ?? "test@example.com",
    name: data?.name ?? "テストユーザー",
    picture: data?.picture ?? null,
    provider: data?.provider ?? "google",
    providerId: data?.providerId ?? `google-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.users).values(user);
  return user;
};

// テスト用のカレンダーを作成
export const createTestCalendar = async (
  db: TestDb,
  ownerId: string,
  data?: {
    id?: string;
    name?: string;
    color?: string;
  }
) => {
  const now = new Date().toISOString();
  const calendar = {
    id: data?.id ?? `cal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ownerId,
    name: data?.name ?? "テストカレンダー",
    color: data?.color ?? "#3B82F6",
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.calendars).values(calendar);
  return calendar;
};

// テスト用のスケジュールを作成
export const createTestSchedule = async (
  db: TestDb,
  userId: string,
  data?: {
    id?: string;
    title?: string;
    startAt?: string;
    endAt?: string | null;
    calendarId?: string;
  }
) => {
  const now = new Date().toISOString();
  const schedule = {
    id: data?.id ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    calendarId: data?.calendarId ?? null,
    title: data?.title ?? "テスト予定",
    startAt: data?.startAt ?? "2025-01-15T12:00:00+09:00",
    endAt: data?.endAt ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.schedules).values(schedule);
  return schedule;
};

// テスト用のサプリメントを作成
export const createTestSupplement = async (
  db: TestDb,
  scheduleId: string,
  data?: {
    id?: string;
    keywords?: string[];
    agentTypes?: string[];
    aiResult?: string | null;
    shopCandidates?: string | null;
    selectedShops?: string | null;
    userMemo?: string | null;
  }
) => {
  const now = new Date().toISOString();
  const supplement = {
    id: data?.id ?? `supp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    scheduleId,
    keywords: data?.keywords ? JSON.stringify(data.keywords) : null,
    agentTypes: data?.agentTypes ? JSON.stringify(data.agentTypes) : null,
    aiResult: data?.aiResult ?? null,
    shopCandidates: data?.shopCandidates ?? null,
    selectedShops: data?.selectedShops ?? null,
    userMemo: data?.userMemo ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.scheduleSupplements).values(supplement);
  return supplement;
};

// DBをリセット
export const resetDatabase = async (db: TestDb) => {
  await db.delete(schema.recurrenceRules);
  await db.delete(schema.scheduleSupplements);
  await db.delete(schema.schedules);
  await db.delete(schema.categories);
  await db.delete(schema.calendarInvitations);
  await db.delete(schema.calendarMembers);
  await db.delete(schema.calendars);
  await db.delete(schema.refreshTokens);
  await db.delete(schema.userProfiles);
  await db.delete(schema.users);
};
