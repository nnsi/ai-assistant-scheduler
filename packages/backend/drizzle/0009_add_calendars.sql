-- カレンダーテーブル
CREATE TABLE calendars (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  deleted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- カレンダーメンバー（共有）テーブル
CREATE TABLE calendar_members (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer',
  invited_by TEXT REFERENCES users(id),
  accepted_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(calendar_id, user_id)
);

-- 招待リンクテーブル
CREATE TABLE calendar_invitations (
  id TEXT PRIMARY KEY,
  calendar_id TEXT NOT NULL REFERENCES calendars(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'viewer',
  expires_at TEXT NOT NULL,
  max_uses INTEGER,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  CHECK (max_uses IS NULL OR use_count <= max_uses)
);

-- 既存テーブルへのカラム追加（NULL許可）
ALTER TABLE schedules ADD COLUMN calendar_id TEXT REFERENCES calendars(id);
ALTER TABLE schedules ADD COLUMN created_by TEXT REFERENCES users(id);
ALTER TABLE categories ADD COLUMN calendar_id TEXT REFERENCES calendars(id);

-- インデックス作成
CREATE INDEX idx_calendar_members_user_id ON calendar_members(user_id);
CREATE INDEX idx_calendar_members_calendar_id ON calendar_members(calendar_id);
CREATE INDEX idx_calendars_owner_id ON calendars(owner_id);
CREATE INDEX idx_schedules_calendar_id ON schedules(calendar_id);
CREATE UNIQUE INDEX idx_invitations_token ON calendar_invitations(token);
CREATE INDEX idx_invitations_calendar_id ON calendar_invitations(calendar_id);
CREATE INDEX idx_invitations_expires_at ON calendar_invitations(expires_at);
