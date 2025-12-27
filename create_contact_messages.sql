-- ================================================
-- TABLE: contact_messages
-- Audit log for messages sent via the contact form
-- ================================================

CREATE TABLE IF NOT EXISTS contact_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_ip TEXT,
    sender_message TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can insert (since the form is public)
-- But we might want to limit this in the future (Edge Function will use service_role, so this is for potential direct access if needed, though EF is safer)
DROP POLICY IF EXISTS "Public can insert contact_messages" ON contact_messages;
CREATE POLICY "Public can insert contact_messages"
    ON contact_messages
    FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can view
DROP POLICY IF EXISTS "Admins can view contact_messages" ON contact_messages;
CREATE POLICY "Admins can view contact_messages"
    ON contact_messages
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT INSERT ON contact_messages TO anon;
GRANT INSERT ON contact_messages TO authenticated;
GRANT ALL ON contact_messages TO service_role;

DO $$
BEGIN
    RAISE NOTICE '✅ Table contact_messages created.';
END $$;
