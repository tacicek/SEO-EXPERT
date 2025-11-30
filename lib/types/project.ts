// Project/Site types
export interface Site {
  id: string;
  created_at: string;
  updated_at: string;
  domain: string;
  name: string;
  user_id: string | null;
  settings: Record<string, any>;
  last_crawled_at: string | null;
  total_urls: number;
  sitemap_url: string | null;
  robots_txt: string | null;
  description: string | null;
  favicon_url: string | null;
  status: 'active' | 'paused' | 'archived';
}

export interface SiteStats extends Site {
  total_analyses: number;
  completed_analyses: number;
  failed_analyses: number;
  avg_score: number | null;
  last_analysis_at: string | null;
  total_tracked_urls: number;
  total_pagespeed_tests: number;
}

export interface Sitemap {
  id: string;
  created_at: string;
  updated_at: string;
  site_id: string;
  url: string;
  type: 'sitemap' | 'sitemap_index';
  urls: Array<{
    loc: string;
    lastmod?: string;
    changefreq?: string;
    priority?: string;
  }>;
  total_urls: number;
  last_fetched_at: string | null;
  status: 'pending' | 'fetching' | 'completed' | 'failed';
  error_message: string | null;
}

export interface PageSpeedResult {
  id: string;
  created_at: string;
  updated_at: string;
  analysis_id: string | null;
  url: string;
  site_id: string | null;
  
  // Scores
  performance_score: number | null;
  accessibility_score: number | null;
  best_practices_score: number | null;
  seo_score: number | null;
  
  // Core Web Vitals
  fcp: number | null;
  lcp: number | null;
  cls: number | null;
  tti: number | null;
  tbt: number | null;
  si: number | null;
  
  // Data
  metrics: Record<string, any>;
  opportunities: Array<{
    id: string;
    title: string;
    description: string;
    score: number;
  }>;
  diagnostics: Array<{
    id: string;
    title: string;
    description: string;
  }>;
  
  strategy: 'mobile' | 'desktop';
  status: 'pending' | 'running' | 'completed' | 'failed';
  error_message: string | null;
}

export interface URLInventory {
  id: string;
  created_at: string;
  updated_at: string;
  site_id: string;
  sitemap_id: string | null;
  url: string;
  path: string | null;
  
  // SEO data
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  word_count: number | null;
  
  // Status
  http_status: number | null;
  is_indexed: boolean;
  last_crawled_at: string | null;
  
  // Performance
  load_time_ms: number | null;
  page_size_kb: number | null;
  
  // Analysis
  last_analyzed_at: string | null;
  analysis_count: number;
  
  discovered_via: 'sitemap' | 'crawl' | 'manual' | null;
  status: 'discovered' | 'crawled' | 'analyzed' | 'error';
}

export interface GSCData {
  id: string;
  created_at: string;
  updated_at: string;
  site_id: string;
  date: string;
  
  // Metrics
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  
  // Detailed data
  queries: Array<{
    query: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  pages: Array<{
    page: string;
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  devices: Record<string, any>;
  countries: Record<string, any>;
  
  data_type: 'daily' | 'weekly' | 'monthly';
}

export interface AnalysisTrend {
  site_id: string;
  analysis_date: string;
  analysis_count: number;
  avg_score: number;
  max_score: number;
  min_score: number;
}
