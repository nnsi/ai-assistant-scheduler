-- Migration: 0005_add_shop_candidates
-- Created at: 2025-01-04
-- Description: Add shop candidates and selected shop columns to schedule_supplements

-- Add shop_candidates column (JSON array of shop objects from AI search)
ALTER TABLE `schedule_supplements` ADD COLUMN `shop_candidates` text;

-- Add selected_shop column (JSON object of the selected shop)
ALTER TABLE `schedule_supplements` ADD COLUMN `selected_shop` text;
