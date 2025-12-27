-- ================================================
-- TABLE: app_settings
-- Stores application-wide configuration like admin email
-- ================================================

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read settings
DROP POLICY IF EXISTS "Public can view app_settings" ON app_settings;
CREATE POLICY "Public can view app_settings"
    ON app_settings
    FOR SELECT
    USING (true);

-- Policy: Only authenticated users (admins) can update
DROP POLICY IF EXISTS "Admins can manage app_settings" ON app_settings;
CREATE POLICY "Admins can manage app_settings"
    ON app_settings
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Insert default admin email
INSERT INTO app_settings (key, value, description)
VALUES 
    ('admin_email', 'samuel.peixoton@gmail.com', 'Email destination for contact form'),
    ('company_name', 'NossaConexão', 'Name of the company displayed in the app')
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- Grant permissions
GRANT SELECT ON app_settings TO anon;
GRANT SELECT ON app_settings TO authenticated;
GRANT ALL ON app_settings TO service_role;

RAISE NOTICE '✅ Table app_settings created and configured.';
