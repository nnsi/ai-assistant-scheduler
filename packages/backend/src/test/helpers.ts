import Database from "better-sqlite3";
import { drizzle, BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import * as schema from "../infra/drizzle/schema";

// テスト用のメモリDBを作成
export const createTestDb = () => {
  const sqlite = new Database(":memory:");

  // テーブルを作成
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id text PRIMARY KEY NOT NULL,
      email text NOT NULL UNIQUE,
      name text NOT NULL,
      picture text,
      google_id text NOT NULL UNIQUE,
      created_at text NOT NULL,
      updated_at text NOT NULL
    );
    CREATE TABLE IF NOT EXISTS schedules (
      id text PRIMARY KEY NOT NULL,
      user_id text NOT NULL,
      title text NOT NULL,
      start_at text NOT NULL,
      end_at text,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS schedule_supplements (
      id text PRIMARY KEY NOT NULL,
      schedule_id text NOT NULL,
      keywords text,
      ai_result text,
      user_memo text,
      created_at text NOT NULL,
      updated_at text NOT NULL,
      FOREIGN KEY (schedule_id) REFERENCES schedules(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_users_google_id ON users (google_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
    CREATE INDEX IF NOT EXISTS idx_schedules_user_id ON schedules (user_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_start_at ON schedules (start_at);
    CREATE INDEX IF NOT EXISTS idx_supplements_schedule_id ON schedule_supplements (schedule_id);
  `);

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
    googleId?: string;
  }
) => {
  const now = new Date().toISOString();
  const user = {
    id: data?.id ?? `user-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    email: data?.email ?? "test@example.com",
    name: data?.name ?? "テストユーザー",
    picture: data?.picture ?? null,
    googleId: data?.googleId ?? `google-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.users).values(user);
  return user;
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
  }
) => {
  const now = new Date().toISOString();
  const schedule = {
    id: data?.id ?? `test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
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
    aiResult?: string | null;
    userMemo?: string | null;
  }
) => {
  const now = new Date().toISOString();
  const supplement = {
    id: data?.id ?? `supp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    scheduleId,
    keywords: data?.keywords ? JSON.stringify(data.keywords) : null,
    aiResult: data?.aiResult ?? null,
    userMemo: data?.userMemo ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await db.insert(schema.scheduleSupplements).values(supplement);
  return supplement;
};

// DBをリセット
export const resetDatabase = async (db: TestDb) => {
  await db.delete(schema.scheduleSupplements);
  await db.delete(schema.schedules);
  await db.delete(schema.users);
};
