-- カテゴリテーブルを追加
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- スケジュールにカテゴリを紐付け
ALTER TABLE schedules ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL;

-- インデックス
CREATE INDEX idx_categories_user_id ON categories(user_id);
