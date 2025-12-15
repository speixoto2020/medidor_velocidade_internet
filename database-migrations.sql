-- ================================================
-- Speed Meter Database Schema
-- ================================================
-- Run this script in your Supabase SQL Editor
-- ================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================
-- TABLE: advertisements
-- ================================================
CREATE TABLE IF NOT EXISTS advertisements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    position TEXT NOT NULL CHECK (position IN ('top-banner', 'sidebar')),
    content_html TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active ads query
CREATE INDEX idx_advertisements_active ON advertisements(is_active, priority DESC, position);

-- ================================================
-- TABLE: test_servers
-- ================================================
CREATE TABLE IF NOT EXISTS test_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    download_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
    upload_url TEXT,
    ping_url TEXT NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active servers
CREATE INDEX idx_test_servers_active ON test_servers(is_active, is_default DESC);

-- ================================================
-- TABLE: speed_test_results
-- ================================================
CREATE TABLE IF NOT EXISTS speed_test_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    server_id UUID REFERENCES test_servers(id) ON DELETE SET NULL,
    server_name TEXT NOT NULL,
    download_speed NUMERIC(10, 2) DEFAULT 0,
    upload_speed NUMERIC(10, 2),
    ping NUMERIC(10, 2) NOT NULL,
    user_ip TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics queries
CREATE INDEX idx_speed_test_results_created ON speed_test_results(created_at DESC);
CREATE INDEX idx_speed_test_results_server ON speed_test_results(server_id);

-- ================================================
-- FUNCTION: Update timestamp on record update
-- ================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_advertisements_updated_at
    BEFORE UPDATE ON advertisements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_servers_updated_at
    BEFORE UPDATE ON test_servers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on all tables
ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE speed_test_results ENABLE ROW LEVEL SECURITY;

-- ================================================
-- RLS POLICIES: advertisements
-- ================================================

-- Public can read active ads
CREATE POLICY "Public can view active advertisements"
    ON advertisements
    FOR SELECT
    USING (is_active = true);

-- Authenticated users can do everything
CREATE POLICY "Authenticated users can manage advertisements"
    ON advertisements
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ================================================
-- RLS POLICIES: test_servers
-- ================================================

-- Public can read active servers
CREATE POLICY "Public can view active servers"
    ON test_servers
    FOR SELECT
    USING (is_active = true);

-- Authenticated users can manage all servers
CREATE POLICY "Authenticated users can manage servers"
    ON test_servers
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- ================================================
-- RLS POLICIES: speed_test_results
-- ================================================

-- Public can insert test results (anonymous tracking)
CREATE POLICY "Public can insert test results"
    ON speed_test_results
    FOR INSERT
    WITH CHECK (true);

-- Public can read all results (for public stats)
CREATE POLICY "Public can view test results"
    ON speed_test_results
    FOR SELECT
    USING (true);

-- Authenticated users can delete results
CREATE POLICY "Authenticated users can delete results"
    ON speed_test_results
    FOR DELETE
    USING (auth.role() = 'authenticated');

-- ================================================
-- SEED DATA: Default Servers
-- ================================================
INSERT INTO test_servers (name, download_urls, upload_url, ping_url, is_default, is_active)
VALUES
    (
        'HTTPBin (Upload Funcional)',
        '["https://httpbin.org/bytes/5000000", "https://httpbin.org/bytes/10000000"]'::jsonb,
        'https://httpbin.org/post',
        'https://httpbin.org/get',
        true,
        true
    ),
    (
        'Cloudflare',
        '["https://speed.cloudflare.com/__down?bytes=10000000", "https://cloudflare.com/cdn-cgi/trace"]'::jsonb,
        NULL,
        'https://cloudflare.com/cdn-cgi/trace',
        true,
        true
    )
ON CONFLICT DO NOTHING;

-- ================================================
-- SEED DATA: Sample Advertisements
-- ================================================
INSERT INTO advertisements (title, position, content_html, is_active, priority)
VALUES
    (
        'Banner Topo Exemplo',
        'top-banner',
        '<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border-radius: 8px;"><h3>🚀 Anúncio Premium</h3><p>Espaço para seu anúncio aqui!</p></div>',
        false,
        10
    ),
    (
        'Sidebar Exemplo',
        'sidebar',
        '<div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; border-radius: 8px; height: 580px; display: flex; flex-direction: column; justify-content: center;"><h3>📢 Anúncio Lateral</h3><p>160x600</p></div>',
        false,
        5
    )
ON CONFLICT DO NOTHING;

-- ================================================
-- VIEWS: Analytics
-- ================================================

-- View for daily statistics
CREATE OR REPLACE VIEW daily_test_stats AS
SELECT
    DATE(created_at) as test_date,
    COUNT(*) as total_tests,
    AVG(download_speed) as avg_download,
    AVG(upload_speed) as avg_upload,
    AVG(ping) as avg_ping,
    MAX(download_speed) as max_download,
    MIN(ping) as min_ping
FROM speed_test_results
GROUP BY DATE(created_at)
ORDER BY test_date DESC;

-- View for server popularity
CREATE OR REPLACE VIEW server_usage_stats AS
SELECT
    ts.name as server_name,
    COUNT(str.id) as test_count,
    AVG(str.download_speed) as avg_download,
    AVG(str.upload_speed) as avg_upload,
    AVG(str.ping) as avg_ping
FROM test_servers ts
LEFT JOIN speed_test_results str ON ts.id = str.server_id
WHERE ts.is_active = true
GROUP BY ts.id, ts.name
ORDER BY test_count DESC;

-- ================================================
-- GRANT PERMISSIONS
-- ================================================

-- Grant access to views for authenticated users
GRANT SELECT ON daily_test_stats TO authenticated;
GRANT SELECT ON server_usage_stats TO authenticated;

-- ================================================
-- SUCCESS MESSAGE
-- ================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Database schema created successfully!';
    RAISE NOTICE '📊 Tables: advertisements, test_servers, speed_test_results';
    RAISE NOTICE '🔒 Row Level Security enabled';
    RAISE NOTICE '🌱 Seed data inserted';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Next steps:';
    RAISE NOTICE '1. Create a user in Supabase Auth for admin access';
    RAISE NOTICE '2. Copy your Supabase URL and anon key';
    RAISE NOTICE '3. Update supabase-config.js with your credentials';
END $$;
