-- 繰り返しルールテーブル
CREATE TABLE recurrence_rules (
  id TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
  interval_value INTEGER NOT NULL DEFAULT 1, -- 繰り返し間隔
  days_of_week TEXT, -- JSON array: ['MO','TU','WE','TH','FR','SA','SU']
  day_of_month INTEGER, -- 月の何日目か (1-31)
  week_of_month INTEGER, -- 月の第何週か (1-5, -1は最終週)
  end_type TEXT NOT NULL DEFAULT 'never', -- 'never', 'date', 'count'
  end_date TEXT, -- 終了日 (YYYY-MM-DD)
  end_count INTEGER, -- 終了回数
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_recurrence_rules_schedule_id ON recurrence_rules(schedule_id);
