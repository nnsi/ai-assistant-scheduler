-- Migration: 0000_init
-- Created at: 2024-12-31

CREATE TABLE IF NOT EXISTS `schedules` (
  `id` text PRIMARY KEY NOT NULL,
  `title` text NOT NULL,
  `start_at` text NOT NULL,
  `end_at` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `schedule_supplements` (
  `id` text PRIMARY KEY NOT NULL,
  `schedule_id` text NOT NULL,
  `keywords` text,
  `ai_result` text,
  `user_memo` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`schedule_id`) REFERENCES `schedules`(`id`) ON DELETE CASCADE
);

-- インデックス
CREATE INDEX IF NOT EXISTS `idx_schedules_start_at` ON `schedules` (`start_at`);
CREATE INDEX IF NOT EXISTS `idx_supplements_schedule_id` ON `schedule_supplements` (`schedule_id`);
