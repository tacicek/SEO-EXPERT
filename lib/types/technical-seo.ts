// Technical SEO Analysis Types - Matches Python Backend Response

export interface TechnicalIssue {
  type: 'error' | 'warning' | 'info';
  category: 'meta' | 'headings' | 'images' | 'url' | 'schema' | 'content';
  message: string;
  recommendation: string;
  impact: 'high' | 'medium' | 'low';
}

export interface MetaTitle {
  value: string | null;
  length: number;
  status: 'good' | 'warning' | 'error';
  issues: string[];
}

export interface MetaDescription {
  value: string | null;
  length: number;
  status: 'good' | 'warning' | 'error';
  issues: string[];
}

export interface CanonicalData {
  value: string | null;
  is_self_referencing: boolean;
  status: 'good' | 'warning';
}

export interface RobotsData {
  value: string | null;
  is_indexable: boolean;
  is_followable: boolean;
}

export interface MetaAnalysis {
  score: number;
  title: MetaTitle;
  description: MetaDescription;
  canonical: CanonicalData;
  robots: RobotsData;
  og_tags: Record<string, string>;
  twitter_tags: Record<string, string>;
  viewport: string | null;
  language: string | null;
  charset: string | null;
  issues: TechnicalIssue[];
}

export interface HeadingItem {
  level: number;
  text: string;
  position: number;
}

export interface HeadingsAnalysis {
  score: number;
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
  structure_valid: boolean;
  hierarchy: HeadingItem[];
  issues: TechnicalIssue[];
}

export interface ImageData {
  src: string;
  alt: string | null;
  has_alt: boolean;
  alt_empty: boolean;
  width: string | null;
  height: string | null;
}

export interface ImagesAnalysis {
  score: number;
  total_images: number;
  images_with_alt: number;
  images_without_alt: number;
  empty_alt: number;
  alt_coverage: number;
  images: ImageData[];
  issues: TechnicalIssue[];
}

export interface UrlAnalysis {
  score: number;
  url: string;
  is_https: boolean;
  is_clean: boolean;
  length: number;
  path_segments: number;
  has_parameters: boolean;
  is_seo_friendly: boolean;
  issues: TechnicalIssue[];
}

export interface SchemaItem {
  type: string;
  valid: boolean;
  data: Record<string, unknown>;
}

export interface SchemaAnalysis {
  score: number;
  has_schema: boolean;
  total_schemas: number;
  valid_schemas: number;
  invalid_schemas: number;
  schema_types: string[];
  schemas: SchemaItem[];
  missing_recommended: string[];
  issues: TechnicalIssue[];
}

export interface ContentQualityAnalysis {
  score: number;
  word_count: number;
  character_count: number;
  sentence_count: number;
  paragraph_count: number;
  avg_paragraph_length: number;
  flesch_reading_ease: number;
  flesch_kincaid_grade: number;
  readability_level: string;
  issues: TechnicalIssue[];
}

export interface TechnicalScores {
  overall: number;
  meta: number;
  headings: number;
  images: number;
  url: number;
  schema: number;
  content_quality: number;
}

export interface TechnicalSEOAnalysis {
  url: string;
  analyzed_at: string;
  score: TechnicalScores;
  meta: MetaAnalysis;
  headings: HeadingsAnalysis;
  images: ImagesAnalysis;
  url_structure: UrlAnalysis;
  schema_markup: SchemaAnalysis;
  content_quality: ContentQualityAnalysis;
  issues: TechnicalIssue[];
  recommendations: string[];
}

// Dashboard specific types
export interface SiteHealthSummary {
  overall_score: number;
  meta_score: number;
  headings_score: number;
  images_score: number;
  schema_score: number;
  content_score: number;
  url_score: number;
  total_issues: number;
  high_issues: number;
  medium_issues: number;
  low_issues: number;
  last_analyzed: string | null;
}

export interface IssuesByCategory {
  meta: number;
  headings: number;
  images: number;
  url: number;
  schema: number;
  content: number;
}

export interface TrendDataPoint {
  date: string;
  score: number;
}

export interface DashboardTechnicalData {
  site_health: SiteHealthSummary;
  issues_by_category: IssuesByCategory;
  recent_issues: TechnicalIssue[];
  score_trend: TrendDataPoint[];
  quick_wins: string[];
}

