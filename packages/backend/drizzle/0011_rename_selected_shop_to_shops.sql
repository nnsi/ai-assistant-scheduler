-- Rename selected_shop to selected_shops for multi-shop selection support
ALTER TABLE schedule_supplements RENAME COLUMN selected_shop TO selected_shops;
