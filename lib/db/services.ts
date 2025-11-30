import { supabase, supabaseAdmin } from './supabase';
import type { AnalysisResult } from '../types/analysis';

// Analysis Services
export const analysisService = {
  // Create a new analysis
  async create(data: {
    url: string;
    title?: string;
    siteId?: string;
    userId?: string;
  }) {
    const { data: analysis, error } = await supabase
      .from('analyses')
      .insert({
        url: data.url,
        title: data.title,
        site_id: data.siteId,
        user_id: data.userId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return analysis;
  },

  // Update analysis with results
  async updateWithResults(
    id: string,
    analysisData: AnalysisResult,
    content?: string
  ) {
    const { data, error } = await supabase
      .from('analyses')
      .update({
        analysis_data: analysisData as any,
        overall_score: analysisData.content_summary.overall_score,
        title: analysisData.title,
        content,
        status: 'completed',
        error_message: null,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark analysis as failed
  async markAsFailed(id: string, errorMessage: string) {
    const { data, error } = await supabase
      .from('analyses')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get analysis by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all analyses (with pagination and filters)
  async getAll(params?: {
    limit?: number;
    offset?: number;
    siteId?: string;
    userId?: string;
    status?: string;
  }) {
    let query = supabase
      .from('analyses')
      .select('*, sites(domain, name)', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.siteId) {
      query = query.eq('site_id', params.siteId);
    }

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  },

  // Get recent analyses
  async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from('analyses')
      .select('*, sites(domain, name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  // Delete analysis
  async delete(id: string) {
    const { error } = await supabase
      .from('analyses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get analysis statistics
  async getStats(params?: { siteId?: string; userId?: string }) {
    let query = supabase
      .from('analyses')
      .select('overall_score, status, created_at');

    if (params?.siteId) {
      query = query.eq('site_id', params.siteId);
    }

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    const total = data.length;
    const completed = data.filter((a) => a.status === 'completed').length;
    const failed = data.filter((a) => a.status === 'failed').length;
    const avgScore = data
      .filter((a) => a.overall_score !== null)
      .reduce((acc, a) => acc + (a.overall_score || 0), 0) / (completed || 1);

    const thisWeek = data.filter((a) => {
      const createdAt = new Date(a.created_at);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return createdAt >= weekAgo;
    }).length;

    return {
      total,
      completed,
      failed,
      avgScore: Math.round(avgScore),
      thisWeek,
    };
  },
};

// Site Services
export const siteService = {
  // Create a new site
  async create(data: { domain: string; name: string; userId?: string }) {
    const { data: site, error } = await supabase
      .from('sites')
      .insert({
        domain: data.domain,
        name: data.name,
        user_id: data.userId,
      })
      .select()
      .single();

    if (error) {
      // If site already exists, return it
      if (error.code === '23505') {
        return this.getByDomain(data.domain);
      }
      throw error;
    }
    return site;
  },

  // Get site by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get site by domain
  async getByDomain(domain: string) {
    const { data, error } = await supabase
      .from('sites')
      .select('*')
      .eq('domain', domain)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all sites
  async getAll(params?: {
    limit?: number;
    offset?: number;
    userId?: string;
    search?: string;
  }) {
    let query = supabase
      .from('sites')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (params?.userId) {
      query = query.eq('user_id', params.userId);
    }

    if (params?.search) {
      query = query.or(
        `domain.ilike.%${params.search}%,name.ilike.%${params.search}%`
      );
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return { data, count };
  },

  // Get site with statistics
  async getWithStats(id: string) {
    const { data, error } = await supabase
      .from('site_stats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Get all sites with statistics
  async getAllWithStats(params?: { userId?: string; search?: string }) {
    let query = supabase.from('site_stats').select('*');

    if (params?.search) {
      query = query.or(
        `domain.ilike.%${params.search}%,name.ilike.%${params.search}%`
      );
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  // Update site
  async update(id: string, data: { domain?: string; name?: string }) {
    const { data: site, error } = await supabase
      .from('sites')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return site;
  },

  // Delete site
  async delete(id: string) {
    const { error } = await supabase.from('sites').delete().eq('id', id);

    if (error) throw error;
  },

  // Get or create site from URL
  async getOrCreateFromUrl(url: string, userId?: string) {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.replace('www.', '');

      // Try to get existing site
      try {
        const site = await this.getByDomain(domain);
        return site;
      } catch {
        // Site doesn't exist, create it
        const name = domain
          .split('.')[0]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());

        return await this.create({ domain, name, userId });
      }
    } catch (error) {
      console.error('Error parsing URL:', error);
      throw new Error('Invalid URL format');
    }
  },
};
