// Core Analysis Types based on PRD

export type SentenceScore = 'green' | 'orange' | 'red';

export interface CriteriaScores {
  accuracy: number; // 0-10
  value: number; // 0-10
  specificity: number; // 0-10
  trustworthiness: number; // 0-10
  expertise: number; // 0-10
  readability: number; // 0-10
  context_fit: number; // 0-10
}

export interface SentenceAnalysis {
  id?: string;
  position: number;
  original: string;
  score: SentenceScore;
  criteria_scores: CriteriaScores;
  reason: string;
  suggestion?: string;
  expert_note?: string;
  sources?: string[];
  is_accepted?: boolean;
}

export interface EEATScore {
  score: number; // 0-100
  signals_found: string[];
  signals_missing: string[];
  recommendations: string[];
}

export interface EEATScores {
  experience: EEATScore;
  expertise: EEATScore;
  authoritativeness: EEATScore;
  trustworthiness: EEATScore;
}

export interface PriorityAction {
  priority: number;
  action: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
}

export interface ContentSummary {
  detected_topic: string;
  expertise_required: 'low' | 'medium' | 'high' | 'YMYL';
  target_audience: string;
  overall_score: number; // 0-100
  expert_verdict: string;
}

export interface AnalysisStatistics {
  total_sentences: number;
  green_count: number;
  orange_count: number;
  red_count: number;
  green_percentage: number;
  word_count: number;
  character_count?: number;
  readability_score?: number;
}

export interface LinkAnalysis {
  internal_links: number;
  external_links: number;
  broken_links: number;
  nofollow_count: number;
  unique_domains: number;
  anchor_text_diversity: number;
}

export interface TopicalAuthorityScore {
  score: number; // 0-100
  coverage_level: 'weak' | 'medium' | 'good' | 'authority';
  missing_topics: string[];
  content_gaps: string[];
}

export interface ContentLinkInfo {
  href: string;
  text: string;
  type: 'internal' | 'external';
}

// Content element structure for structured content display
export interface ContentElementInfo {
  type: 'paragraph' | 'heading' | 'list' | 'blockquote' | 'list-item';
  tag: string;
  level?: number; // For headings (1-6)
  html: string;
  text: string;
  children?: ContentElementInfo[]; // For nested structures like lists
}

// Headings structure
export interface HeadingsInfo {
  h1: string[];
  h2: string[];
  h3: string[];
  h4: string[];
  h5: string[];
  h6: string[];
}

export interface AnalysisResult {
  id: string;
  url?: string;
  title: string;
  htmlContent?: string; // Processed HTML with formatted elements
  rawMainHtml?: string; // Raw HTML of main content area (for editor)
  contentElements?: ContentElementInfo[]; // Structured content elements
  headings?: HeadingsInfo; // All headings in the content
  content_summary: ContentSummary;
  sentence_analysis: SentenceAnalysis[];
  eeat_scores: EEATScores;
  priority_actions: PriorityAction[];
  statistics: AnalysisStatistics;
  link_analysis?: LinkAnalysis;
  links?: ContentLinkInfo[]; // All links in content
  topical_authority?: TopicalAuthorityScore;
  created_at: string;
  updated_at: string;
}

export interface AnalysisRequest {
  url?: string;
  content?: string;
  title?: string;
  topic?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: string;
  message?: string;
}
