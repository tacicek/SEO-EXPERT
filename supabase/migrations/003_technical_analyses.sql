-- Technical SEO Analyses Table
-- Stores detailed technical SEO analysis results

CREATE TABLE IF NOT EXISTS public.technical_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  
  -- Overall and category scores
  score INTEGER DEFAULT 0,
  meta_score INTEGER DEFAULT 0,
  headings_score INTEGER DEFAULT 0,
  images_score INTEGER DEFAULT 0,
  schema_score INTEGER DEFAULT 0,
  content_score INTEGER DEFAULT 0,
  url_score INTEGER DEFAULT 0,
  
  -- Issue counts
  total_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 0,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,
  
  -- Full analysis data (JSON)
  analysis_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.technical_analyses ENABLE ROW LEVEL SECURITY;

-- Users can only see their own analyses
CREATE POLICY "Users can view own technical analyses"
  ON public.technical_analyses FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own analyses
CREATE POLICY "Users can insert own technical analyses"
  ON public.technical_analyses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own analyses
CREATE POLICY "Users can update own technical analyses"
  ON public.technical_analyses FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own analyses
CREATE POLICY "Users can delete own technical analyses"
  ON public.technical_analyses FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_technical_analyses_user_id ON public.technical_analyses(user_id);
CREATE INDEX idx_technical_analyses_site_id ON public.technical_analyses(site_id);
CREATE INDEX idx_technical_analyses_created_at ON public.technical_analyses(created_at DESC);
CREATE INDEX idx_technical_analyses_score ON public.technical_analyses(score);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_technical_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_technical_analyses_updated_at
  BEFORE UPDATE ON public.technical_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_technical_analyses_updated_at();

