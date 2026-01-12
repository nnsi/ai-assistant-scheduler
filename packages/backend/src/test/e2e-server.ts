/**
 * E2Eテスト用サーバー
 * Node.js + オンメモリSQLiteで動作
 * 本番のindex.tsをそのまま使い、DBだけをオンメモリに差し替える
 */
import { serve } from "@hono/node-server";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../infra/drizzle/schema";
import { createApp, type Bindings } from "../index";
import { resetDatabase, type TestDb } from "./helpers";
import { createD1Adapter } from "./d1-adapter";

// テスト用DDL（helpers.tsと同じ）
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
`;

// グローバルSQLite（リセット用）
let globalSqlite: Database.Database;
let globalDb: TestDb;

// E2E用のBindings（D1アダプター経由でSQLiteを使用）
const e2eBindings: Bindings = {
  get DB() {
    return createD1Adapter(globalSqlite) as any;
  },
  OPENROUTER_API_KEY: "e2e-test-key",
  GOOGLE_CLIENT_ID: "e2e-google-client-id",
  GOOGLE_CLIENT_SECRET: "e2e-google-client-secret",
  JWT_SECRET: "e2e-test-jwt-secret",
  FRONTEND_URL: "http://127.0.0.1:5174",
  ENABLE_DEV_AUTH: "true",
};

// Honoアプリを作成
const app = createApp();

// DBリセット用エンドポイント（E2Eテスト用）
app.post("/api/e2e/reset", async (c) => {
  await resetDatabase(globalDb);
  return c.json({ success: true });
});

// SQLite初期化
function initializeDatabase() {
  globalSqlite = new Database(":memory:");
  globalSqlite.exec(TEST_DDL);
  globalSqlite.pragma("foreign_keys = ON");
  globalDb = drizzle(globalSqlite, { schema });
}

// サーバー起動
initializeDatabase();
const port = parseInt(process.env.PORT || "8788", 10);

console.log(`E2E test server starting on port ${port}...`);
serve(
  {
    fetch: (request) => app.fetch(request, e2eBindings),
    port,
  },
  (info) => {
    console.log(`E2E test server running at http://127.0.0.1:${info.port}`);
  }
);
