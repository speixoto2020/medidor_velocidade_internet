-- Add columns for client identification (IP, ISP, Device UUID)
-- Run this in Supabase SQL Editor

ALTER TABLE speed_test_results
ADD COLUMN IF NOT EXISTS client_ip TEXT,
ADD COLUMN IF NOT EXISTS client_isp TEXT,
ADD COLUMN IF NOT EXISTS client_uuid TEXT;

-- Update the view to include these if needed (optional)
-- The existing views are aggregated (GROUP BY) so they don't need changes unless ID tracking is desired there.
