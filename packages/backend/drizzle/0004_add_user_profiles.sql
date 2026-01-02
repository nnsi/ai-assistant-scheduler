-- Migration: 0004_add_user_profiles
-- Created at: 2026-01-03
-- Description: Add user_profiles table for storing user preferences (こだわり条件)

CREATE TABLE IF NOT EXISTS `user_profiles` (
  `id` text PRIMARY KEY NOT NULL,
  `user_id` text NOT NULL UNIQUE,
  `required_conditions` text,
  `preferred_conditions` text,
  `subjective_conditions` text,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS `idx_user_profiles_user_id` ON `user_profiles` (`user_id`);
