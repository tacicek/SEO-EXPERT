import type { TechnicalSEOAnalysis, DashboardTechnicalData, SiteHealthSummary, IssuesByCategory, TechnicalIssue } from '@/lib/types/technical-seo';

const TECHNICAL_SEO_API_URL = process.env.TECHNICAL_SEO_API_URL || 'http://localhost:8000';

export class TechnicalSEOService {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || TECHNICAL_SEO_API_URL;
  }

  /**
   * Check if the Technical SEO microservice is healthy
   */
  async healthCheck(): Promise<{ status: string; version: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) {
        throw new Error('Service unavailable');
      }
      
      return response.json();
    } catch (error) {
      console.error('Technical SEO service health check failed:', error);
      throw new Error('Technical SEO service is not available');
    }
  }

  /**
   * Analyze a URL for technical SEO issues
   */
  async analyzeUrl(url: string): Promise<TechnicalSEOAnalysis> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(error.detail || 'Analysis failed');
      }

      return response.json();
    } catch (error) {
      console.error('Technical SEO analysis failed:', error);
      throw error;
    }
  }

  /**
   * Quick analysis (faster, less detailed)
   */
  async quickAnalyze(url: string): Promise<{
    url: string;
    critical_issues_count: number;
    critical_issues: TechnicalIssue[];
    meta_score: number;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/analyze/quick`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Quick analysis failed' }));
        throw new Error(error.detail || 'Quick analysis failed');
      }

      return response.json();
    } catch (error) {
      console.error('Quick analysis failed:', error);
      throw error;
    }
  }

  /**
   * Generate site health summary from analysis
   */
  generateSiteHealth(analysis: TechnicalSEOAnalysis): SiteHealthSummary {
    const issues = analysis.issues || [];
    
    return {
      overall_score: analysis.score.overall || 0,
      meta_score: analysis.score.meta || analysis.meta?.score || 0,
      headings_score: analysis.score.headings || analysis.headings?.score || 0,
      images_score: analysis.score.images || analysis.images?.score || 0,
      schema_score: analysis.score.schema || analysis.schema_markup?.score || 0,
      content_score: analysis.score.content_quality || analysis.content_quality?.score || 0,
      url_score: analysis.score.url || analysis.url_structure?.score || 0,
      total_issues: issues.length,
      high_issues: issues.filter(i => i.impact === 'high').length,
      medium_issues: issues.filter(i => i.impact === 'medium').length,
      low_issues: issues.filter(i => i.impact === 'low').length,
      last_analyzed: analysis.analyzed_at,
    };
  }

  /**
   * Group issues by category
   */
  getIssuesByCategory(issues: TechnicalIssue[]): IssuesByCategory {
    return {
      meta: issues.filter(i => i.category === 'meta').length,
      headings: issues.filter(i => i.category === 'headings').length,
      images: issues.filter(i => i.category === 'images').length,
      url: issues.filter(i => i.category === 'url').length,
      schema: issues.filter(i => i.category === 'schema').length,
      content: issues.filter(i => i.category === 'content').length,
    };
  }

  /**
   * Extract quick wins (easy to fix, high impact)
   */
  getQuickWins(analysis: TechnicalSEOAnalysis): string[] {
    const quickWins: string[] = [];
    
    // Meta issues
    if (analysis.meta?.title?.status === 'error') {
      quickWins.push('Add a descriptive title tag (50-60 characters)');
    }
    if (analysis.meta?.description?.status === 'error') {
      quickWins.push('Add a compelling meta description (150-160 characters)');
    }
    if (!analysis.meta?.viewport) {
      quickWins.push('Add viewport meta tag for mobile responsiveness');
    }
    
    // Headings
    if (analysis.headings?.h1?.length === 0) {
      quickWins.push('Add an H1 heading to define the main topic');
    }
    if (analysis.headings?.h1?.length > 1) {
      quickWins.push('Use only one H1 tag per page');
    }
    
    // Images
    if (analysis.images?.images_without_alt > 0) {
      quickWins.push(`Add alt text to ${analysis.images.images_without_alt} images`);
    }
    
    // Schema
    if (!analysis.schema_markup?.has_schema) {
      quickWins.push('Implement Schema.org structured data for rich results');
    }
    
    // Content
    if (analysis.content_quality?.word_count < 300) {
      quickWins.push('Expand content to at least 300 words');
    }
    
    return quickWins.slice(0, 5); // Return top 5 quick wins
  }

  /**
   * Get dashboard data from analysis
   */
  getDashboardData(analysis: TechnicalSEOAnalysis): DashboardTechnicalData {
    const issues = analysis.issues || [];
    
    return {
      site_health: this.generateSiteHealth(analysis),
      issues_by_category: this.getIssuesByCategory(issues),
      recent_issues: issues.filter(i => i.impact === 'high').slice(0, 5),
      score_trend: [], // This would need historical data
      quick_wins: this.getQuickWins(analysis),
    };
  }
}

// Singleton instance
export const technicalSEOService = new TechnicalSEOService();



