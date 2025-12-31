-- Migration: 0001_add_users
-- Created at: 2024-12-31
-- Description: Add users table and user_id to schedules for authentication

-- Create users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `picture` text,
  `google_id` text NOT NULL UNIQUE,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

-- Create index on google_id for fast OAuth lookup
CREATE INDEX IF NOT EXISTS `idx_users_google_id` ON `users` (`google_id`);
CREATE INDEX IF NOT EXISTS `idx_users_email` ON `users` (`email`);

-- Add user_id column to schedules
-- Note: For new installations, this will enforce FK constraint
-- For existing data, we need to handle migration carefully
ALTER TABLE `schedules` ADD COLUMN `user_id` text REFERENCES `users`(`id`) ON DELETE CASCADE;

-- Create index on user_id for fast user-schedule lookup
CREATE INDEX IF NOT EXISTS `idx_schedules_user_id` ON `schedules` (`user_id`);
