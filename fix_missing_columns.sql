-- Add missing columns to existing speed_test_results table

DO $$
BEGIN
    -- Add client_isp if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'speed_test_results' AND column_name = 'client_isp') THEN
        ALTER TABLE speed_test_results ADD COLUMN client_isp TEXT;
    END IF;

    -- Add client_uuid if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'speed_test_results' AND column_name = 'client_uuid') THEN
        ALTER TABLE speed_test_results ADD COLUMN client_uuid UUID;
    END IF;
END $$;

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'speed_test_results';
