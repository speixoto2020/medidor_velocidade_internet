-- Add columns for client identification
-- Run this in Supabase SQL Editor

ALTER TABLE speed_test_results
ADD COLUMN IF NOT EXISTS client_isp TEXT,
ADD COLUMN IF NOT EXISTS client_uuid TEXT;

-- Verify if client_ip exists, if not relying on user_ip mapping
-- (We are mapping client_ip -> user_ip in JS, so no new column needed for IP)
