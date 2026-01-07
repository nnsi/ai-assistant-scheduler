-- 終日イベントフラグを追加
ALTER TABLE schedules ADD COLUMN is_all_day INTEGER DEFAULT 0 NOT NULL;
