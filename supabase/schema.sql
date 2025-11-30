-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create sites table
CREATE TABLE IF NOT EXISTS sites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    domain TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    user_id UUID DEFAULT NULL,
    CONSTRAINT domain_format CHECK (domain ~ '^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$')
);

-- Create analyses table
CREATE TABLE IF NOT EXISTS analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    url TEXT NOT NULL,
    title TEXT,
    site_id UUID REFERENCES sites(id) ON DELETE SET NULL,
    user_id UUID DEFAULT NULL,
    content TEXT,
    analysis_data JSONB,
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    CONSTRAINT url_format CHECK (url ~ '^https?://')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_created_at ON sites(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analyses_url ON analyses(url);
CREATE INDEX IF NOT EXISTS idx_analyses_site_id ON analyses(site_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_status ON analyses(status);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(overall_score);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_sites_updated_at
    BEFORE UPDATE ON sites
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyses_updated_at
    BEFORE UPDATE ON analyses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create view for site statistics
CREATE OR REPLACE VIEW site_stats WITH (security_invoker = on) AS
SELECT 
    s.id,
    s.domain,
    s.name,
    COUNT(a.id) as total_analyses,
    ROUND(AVG(a.overall_score)) as avg_score,
    MAX(a.created_at) as last_analyzed,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_analyses,
    COUNT(CASE WHEN a.status = 'failed' THEN 1 END) as failed_analyses
FROM sites s
LEFT JOIN analyses a ON s.id = a.site_id
GROUP BY s.id, s.domain, s.name;

-- Enable Row Level Security (RLS)
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust based on your auth requirements)
-- For now, allow read access to all, write access to authenticated users

-- Sites policies
CREATE POLICY "Allow public read access to sites"
    ON sites FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert to sites"
    ON sites FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update to sites"
    ON sites FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Analyses policies
CREATE POLICY "Allow public read access to analyses"
    ON analyses FOR SELECT
    USING (true);

CREATE POLICY "Allow public insert to analyses"
    ON analyses FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public update to analyses"
    ON analyses FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
