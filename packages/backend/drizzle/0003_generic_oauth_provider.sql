-- Migration: 0003_generic_oauth_provider
-- Created at: 2026-01-01
-- Description: Replace google_id with generic provider + provider_id columns

-- Disable foreign key checks during migration
PRAGMA foreign_keys = OFF;

-- Step 1: Create new users table without google_id
CREATE TABLE `users_new` (
  `id` text PRIMARY KEY NOT NULL,
  `email` text NOT NULL UNIQUE,
  `name` text NOT NULL,
  `picture` text,
  `provider` text NOT NULL,
  `provider_id` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);

-- Step 2: Migrate existing data (google_id -> provider_id)
INSERT INTO `users_new` (`id`, `email`, `name`, `picture`, `provider`, `provider_id`, `created_at`, `updated_at`)
SELECT `id`, `email`, `name`, `picture`, 'google', `google_id`, `created_at`, `updated_at`
FROM `users`;

-- Step 3: Drop old table and rename new one
DROP TABLE `users`;
ALTER TABLE `users_new` RENAME TO `users`;

-- Step 4: Recreate indexes
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
CREATE INDEX `idx_users_provider_id` ON `users` (`provider`, `provider_id`);

-- Re-enable foreign key checks
PRAGMA foreign_keys = ON;
