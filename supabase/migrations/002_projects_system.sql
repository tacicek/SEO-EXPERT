-- Migration: Project-based System with Advanced Features
-- Version: 002
-- Description: Adds project management, sitemap tracking, PageSpeed results, and GSC data

-- ============================================
-- 1. Update sites table (projects)
-- ============================================

-- Add new columns to sites table
ALTER TABLE sites 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_urls INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sitemap_url TEXT,
ADD COLUMN IF NOT EXISTS robots_txt TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS favicon_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived'));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
CREATE INDEX IF NOT EXISTS idx_sites_status ON sites(status);
CREATE INDEX IF NOT EXISTS idx_sites_domain ON sites(domain);

-- ============================================
-- 2. Sitemaps table
-- ============================================

CREATE TABLE IF NOT EXISTS sitemaps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT DEFAULT 'sitemap' CHECK (type IN ('sitemap', 'sitemap_index')),
    urls JSONB DEFAULT '[]',
    total_urls INTEGER DEFAULT 0,
    last_fetched_at TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'fetching', 'completed', 'failed')),
    error_message TEXT
);

-- Indexes for sitemaps
CREATE INDEX IF NOT EXISTS idx_sitemaps_site_id ON sitemaps(site_id);
CREATE INDEX IF NOT EXISTS idx_sitemaps_status ON sitemaps(status);
CREATE INDEX IF NOT EXISTS idx_sitemaps_updated_at ON sitemaps(updated_at DESC);

-- ============================================
-- 3. PageSpeed Results table
-- ============================================

CREATE TABLE IF NOT EXISTS pagespeed_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    analysis_id UUID REFERENCES analyses(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    site_id UUID REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Scores (0-100)
    performance_score INTEGER,
    accessibility_score INTEGER,
    best_practices_score INTEGER,
    seo_score INTEGER,
    
    -- Core Web Vitals
    fcp FLOAT, -- First Contentful Paint
    lcp FLOAT, -- Largest Contentful Paint  
    cls FLOAT, -- Cumulative Layout Shift
    tti FLOAT, -- Time to Interactive
    tbt FLOAT, -- Total Blocking Time
    si FLOAT,  -- Speed Index
    
    -- Full metrics data
    metrics JSONB DEFAULT '{}',
    opportunities JSONB DEFAULT '[]',
    diagnostics JSONB DEFAULT '[]',
    
    -- Metadata
    strategy TEXT DEFAULT 'mobile' CHECK (strategy IN ('mobile', 'desktop')),
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    error_message TEXT
);

-- Indexes for pagespeed_results
CREATE INDEX IF NOT EXISTS idx_pagespeed_site_id ON pagespeed_results(site_id);
CREATE INDEX IF NOT EXISTS idx_pagespeed_analysis_id ON pagespeed_results(analysis_id);
CREATE INDEX IF NOT EXISTS idx_pagespeed_created_at ON pagespeed_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pagespeed_url ON pagespeed_results(url);

-- ============================================
-- 4. Google Search Console Data table
-- ============================================

CREATE TABLE IF NOT EXISTS gsc_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    
    -- Date range
    date DATE NOT NULL,
    
    -- Aggregated metrics
    clicks INTEGER DEFAULT 0,
    impressions INTEGER DEFAULT 0,
    ctr FLOAT DEFAULT 0,
    position FLOAT DEFAULT 0,
    
    -- Detailed data
    queries JSONB DEFAULT '[]', -- Top queries with their metrics
    pages JSONB DEFAULT '[]',   -- Top pages with their metrics
    devices JSONB DEFAULT '{}', -- Breakdown by device
    countries JSONB DEFAULT '{}', -- Breakdown by country
    
    -- Metadata
    data_type TEXT DEFAULT 'daily' CHECK (data_type IN ('daily', 'weekly', 'monthly')),
    
    UNIQUE(site_id, date, data_type)
);

-- Indexes for gsc_data
CREATE INDEX IF NOT EXISTS idx_gsc_site_id ON gsc_data(site_id);
CREATE INDEX IF NOT EXISTS idx_gsc_date ON gsc_data(date DESC);
CREATE INDEX IF NOT EXISTS idx_gsc_site_date ON gsc_data(site_id, date DESC);

-- ============================================
-- 5. URL Inventory table (for tracking all URLs)
-- ============================================

CREATE TABLE IF NOT EXISTS url_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    sitemap_id UUID REFERENCES sitemaps(id) ON DELETE SET NULL,
    
    -- URL info
    url TEXT NOT NULL,
    path TEXT,
    
    -- SEO data
    title TEXT,
    meta_description TEXT,
    h1 TEXT,
    word_count INTEGER,
    
    -- Status
    http_status INTEGER,
    is_indexed BOOLEAN DEFAULT FALSE,
    last_crawled_at TIMESTAMP WITH TIME ZONE,
    
    -- Performance
    load_time_ms INTEGER,
    page_size_kb INTEGER,
    
    -- Analysis tracking
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    analysis_count INTEGER DEFAULT 0,
    
    -- Metadata
    discovered_via TEXT, -- 'sitemap', 'crawl', 'manual'
    status TEXT DEFAULT 'discovered' CHECK (status IN ('discovered', 'crawled', 'analyzed', 'error')),
    
    UNIQUE(site_id, url)
);

-- Indexes for url_inventory
CREATE INDEX IF NOT EXISTS idx_url_inventory_site_id ON url_inventory(site_id);
CREATE INDEX IF NOT EXISTS idx_url_inventory_url ON url_inventory(url);
CREATE INDEX IF NOT EXISTS idx_url_inventory_status ON url_inventory(status);
CREATE INDEX IF NOT EXISTS idx_url_inventory_last_analyzed ON url_inventory(last_analyzed_at DESC);

-- ============================================
-- 6. Update existing analyses table
-- ============================================

-- Add PageSpeed reference (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='analyses' AND column_name='pagespeed_id') THEN
        ALTER TABLE analyses ADD COLUMN pagespeed_id UUID REFERENCES pagespeed_results(id) ON DELETE SET NULL;
    END IF;
END $$;

-- ============================================
-- 7. Views for reporting
-- ============================================

-- Drop existing views first to avoid conflicts
DROP VIEW IF EXISTS site_stats CASCADE;
DROP VIEW IF EXISTS analysis_trends CASCADE;

-- Site statistics view (recreate)
CREATE VIEW site_stats AS
SELECT 
    s.id,
    s.domain,
    s.name,
    s.user_id,
    s.created_at,
    s.updated_at,
    s.last_crawled_at,
    s.total_urls,
    s.status,
    COUNT(DISTINCT a.id) as total_analyses,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_analyses,
    COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'failed') as failed_analyses,
    AVG(a.overall_score) FILTER (WHERE a.overall_score IS NOT NULL) as avg_score,
    MAX(a.created_at) as last_analysis_at,
    COUNT(DISTINCT ui.id) as total_tracked_urls,
    COUNT(DISTINCT ps.id) as total_pagespeed_tests
FROM sites s
LEFT JOIN analyses a ON s.id = a.site_id
LEFT JOIN url_inventory ui ON s.id = ui.site_id
LEFT JOIN pagespeed_results ps ON s.id = ps.site_id
GROUP BY s.id, s.domain, s.name, s.user_id, s.created_at, s.updated_at, 
         s.last_crawled_at, s.total_urls, s.status;

-- Analysis trends view
CREATE VIEW analysis_trends AS
SELECT 
    a.site_id,
    DATE(a.created_at) as analysis_date,
    COUNT(*) as analysis_count,
    AVG(a.overall_score) as avg_score,
    MAX(a.overall_score) as max_score,
    MIN(a.overall_score) as min_score
FROM analyses a
WHERE a.status = 'completed'
GROUP BY a.site_id, DATE(a.created_at)
ORDER BY a.site_id, analysis_date DESC;

-- ============================================
-- 8. Row Level Security (RLS)
-- ============================================

-- Enable RLS on new tables
ALTER TABLE sitemaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagespeed_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE gsc_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_inventory ENABLE ROW LEVEL SECURITY;

-- Sitemaps policies
CREATE POLICY "Users can view their own site sitemaps"
    ON sitemaps FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert sitemaps for their sites"
    ON sitemaps FOR INSERT
    WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own site sitemaps"
    ON sitemaps FOR UPDATE
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- PageSpeed policies
CREATE POLICY "Users can view their own PageSpeed results"
    ON pagespeed_results FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert PageSpeed results"
    ON pagespeed_results FOR INSERT
    WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- GSC data policies
CREATE POLICY "Users can view their own GSC data"
    ON gsc_data FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert GSC data"
    ON gsc_data FOR INSERT
    WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- URL inventory policies
CREATE POLICY "Users can view their own URL inventory"
    ON url_inventory FOR SELECT
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert URLs"
    ON url_inventory FOR INSERT
    WITH CHECK (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their URLs"
    ON url_inventory FOR UPDATE
    USING (site_id IN (SELECT id FROM sites WHERE user_id = auth.uid()));

-- ============================================
-- 9. Functions
-- ============================================

-- Function to update site's last_crawled_at
CREATE OR REPLACE FUNCTION update_site_last_crawled()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE sites 
    SET last_crawled_at = NEW.last_fetched_at,
        total_urls = (SELECT COUNT(*) FROM url_inventory WHERE site_id = NEW.site_id)
    WHERE id = NEW.site_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for sitemap updates
DROP TRIGGER IF EXISTS trigger_update_site_last_crawled ON sitemaps;
CREATE TRIGGER trigger_update_site_last_crawled
    AFTER INSERT OR UPDATE OF last_fetched_at ON sitemaps
    FOR EACH ROW
    EXECUTE FUNCTION update_site_last_crawled();

-- ============================================
-- 10. Sample data / comments
-- ============================================

COMMENT ON TABLE sitemaps IS 'Stores sitemap URLs and their contents for each site';
COMMENT ON TABLE pagespeed_results IS 'Google PageSpeed Insights test results';
COMMENT ON TABLE gsc_data IS 'Google Search Console performance data';
COMMENT ON TABLE url_inventory IS 'Complete inventory of all URLs discovered for each site';

-- End of migration
