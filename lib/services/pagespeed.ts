import { supabase } from '../db/supabase';
import type { PageSpeedResult } from '../types/project';

const PAGESPEED_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PAGESPEED_API_KEY || '';

export const pageSpeedService = {
  // Run PageSpeed Insights test
  async runTest(
    url: string,
    strategy: 'mobile' | 'desktop' = 'mobile'
  ): Promise<any> {
    if (!PAGESPEED_API_KEY) {
      throw new Error('Google PageSpeed API key not configured');
    }

    try {
      const apiUrl = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
      apiUrl.searchParams.append('url', url);
      apiUrl.searchParams.append('key', PAGESPEED_API_KEY);
      apiUrl.searchParams.append('strategy', strategy);
      apiUrl.searchParams.append('category', 'PERFORMANCE');
      apiUrl.searchParams.append('category', 'ACCESSIBILITY');
      apiUrl.searchParams.append('category', 'BEST_PRACTICES');
      apiUrl.searchParams.append('category', 'SEO');

      const response = await fetch(apiUrl.toString());
      
      if (!response.ok) {
        throw new Error(`PageSpeed API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('PageSpeed API error:', error);
      throw error;
    }
  },

  // Parse PageSpeed result
  parseResult(data: any) {
    const lighthouseResult = data.lighthouseResult;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    return {
      // Scores (0-100)
      performance_score: Math.round((categories.performance?.score || 0) * 100),
      accessibility_score: Math.round((categories.accessibility?.score || 0) * 100),
      best_practices_score: Math.round((categories['best-practices']?.score || 0) * 100),
      seo_score: Math.round((categories.seo?.score || 0) * 100),

      // Core Web Vitals (in milliseconds/score)
      fcp: audits['first-contentful-paint']?.numericValue || null,
      lcp: audits['largest-contentful-paint']?.numericValue || null,
      cls: audits['cumulative-layout-shift']?.numericValue || null,
      tti: audits['interactive']?.numericValue || null,
      tbt: audits['total-blocking-time']?.numericValue || null,
      si: audits['speed-index']?.numericValue || null,

      // Opportunities
      opportunities: Object.keys(audits)
        .filter(key => audits[key].details?.type === 'opportunity')
        .map(key => ({
          id: key,
          title: audits[key].title,
          description: audits[key].description,
          score: audits[key].score || 0,
          savings: audits[key].details?.overallSavingsMs || 0,
        }))
        .sort((a, b) => b.savings - a.savings)
        .slice(0, 10),

      // Diagnostics
      diagnostics: Object.keys(audits)
        .filter(key => audits[key].details?.type === 'diagnostic')
        .map(key => ({
          id: key,
          title: audits[key].title,
          description: audits[key].description,
          score: audits[key].score || 0,
        }))
        .slice(0, 10),

      // Full metrics
      metrics: {
        fetchTime: data.analysisUTCTimestamp,
        finalUrl: lighthouseResult.finalUrl,
        userAgent: lighthouseResult.userAgent,
        timing: lighthouseResult.timing,
      },
    };
  },

  // Create PageSpeed result
  async create(data: {
    url: string;
    siteId?: string;
    analysisId?: string;
    strategy?: 'mobile' | 'desktop';
  }): Promise<PageSpeedResult> {
    const { data: result, error } = await supabase
      .from('pagespeed_results')
      .insert({
        url: data.url,
        site_id: data.siteId,
        analysis_id: data.analysisId,
        strategy: data.strategy || 'mobile',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // Update with test results
  async updateWithResults(id: string, parsedData: any): Promise<PageSpeedResult> {
    const { data: result, error } = await supabase
      .from('pagespeed_results')
      .update({
        ...parsedData,
        status: 'completed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // Mark as failed
  async markAsFailed(id: string, errorMessage: string): Promise<PageSpeedResult> {
    const { data: result, error } = await supabase
      .from('pagespeed_results')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  // Run full test and save
  async analyze(data: {
    url: string;
    siteId?: string;
    analysisId?: string;
    strategy?: 'mobile' | 'desktop';
  }): Promise<PageSpeedResult> {
    // Create pending result
    const result = await this.create(data);

    try {
      // Update to running
      await supabase
        .from('pagespeed_results')
        .update({ status: 'running' })
        .eq('id', result.id);

      // Run test
      const testData = await this.runTest(data.url, data.strategy);
      
      // Parse results
      const parsedData = this.parseResult(testData);

      // Update with results
      return await this.updateWithResults(result.id, parsedData);
    } catch (error: any) {
      console.error('PageSpeed analysis error:', error);
      return await this.markAsFailed(result.id, error.message);
    }
  },

  // Get results for a site
  async getBySiteId(siteId: string, limit = 10): Promise<PageSpeedResult[]> {
    const { data, error } = await supabase
      .from('pagespeed_results')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  // Get result by ID
  async getById(id: string): Promise<PageSpeedResult | null> {
    const { data, error } = await supabase
      .from('pagespeed_results')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // Get results for analysis
  async getByAnalysisId(analysisId: string): Promise<PageSpeedResult | null> {
    const { data, error } = await supabase
      .from('pagespeed_results')
      .select('*')
      .eq('analysis_id', analysisId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  },

  // Get performance trends
  async getTrends(siteId: string, days = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('pagespeed_results')
      .select('created_at, performance_score, accessibility_score, best_practices_score, seo_score, strategy')
      .eq('site_id', siteId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Delete result
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagespeed_results')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
