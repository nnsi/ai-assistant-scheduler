-- Migration: 0003_generic_oauth_provider
-- Created at: 2026-01-01
-- Description: Replace google_id with generic provider + provider_id columns

-- Step 1: Add new columns
ALTER TABLE `users` ADD COLUMN `provider` text;
ALTER TABLE `users` ADD COLUMN `provider_id` text;

-- Step 2: Migrate existing google_id data
UPDATE `users` SET `provider` = 'google', `provider_id` = `google_id` WHERE `google_id` IS NOT NULL;

-- Step 3: Create index on provider + provider_id for fast OAuth lookup
CREATE INDEX IF NOT EXISTS `idx_users_provider_id` ON `users` (`provider`, `provider_id`);

-- Note: SQLite doesn't support dropping columns in older versions
-- The google_id column will remain but should not be used
-- In production, consider recreating the table without google_id if needed
