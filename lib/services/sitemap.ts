import { supabase } from '../db/supabase';
import type { Sitemap } from '../types/project';
import { XMLParser } from 'fast-xml-parser';

export const sitemapService = {
  // Fetch and parse robots.txt
  async fetchRobotsTxt(domain: string): Promise<string | null> {
    try {
      const url = `https://${domain}/robots.txt`;
      const response = await fetch(url);
      
      if (!response.ok) return null;
      
      const text = await response.text();
      return text;
    } catch (error) {
      console.error('Error fetching robots.txt:', error);
      return null;
    }
  },

  // Extract sitemap URLs from robots.txt
  extractSitemapUrls(robotsTxt: string): string[] {
    const sitemapUrls: string[] = [];
    const lines = robotsTxt.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().startsWith('sitemap:')) {
        const url = trimmed.substring(8).trim();
        if (url) sitemapUrls.push(url);
      }
    }
    
    return sitemapUrls;
  },

  // Fetch and parse sitemap XML
  async fetchSitemap(url: string): Promise<{
    type: 'sitemap' | 'sitemap_index';
    urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>;
  } | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      
      const xml = await response.text();
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      });
      
      const result = parser.parse(xml);
      
      // Check if it's a sitemap index
      if (result.sitemapindex) {
        const sitemaps = Array.isArray(result.sitemapindex.sitemap)
          ? result.sitemapindex.sitemap
          : [result.sitemapindex.sitemap];
        
        return {
          type: 'sitemap_index',
          urls: sitemaps.map((sm: any) => ({
            loc: sm.loc,
            lastmod: sm.lastmod,
          })),
        };
      }
      
      // Regular sitemap
      if (result.urlset) {
        const urls = Array.isArray(result.urlset.url)
          ? result.urlset.url
          : [result.urlset.url];
        
        return {
          type: 'sitemap',
          urls: urls.map((url: any) => ({
            loc: url.loc,
            lastmod: url.lastmod,
            changefreq: url.changefreq,
            priority: url.priority,
          })),
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching sitemap:', error);
      return null;
    }
  },

  // Create sitemap record
  async create(data: {
    siteId: string;
    url: string;
    type?: 'sitemap' | 'sitemap_index';
  }): Promise<Sitemap> {
    const { data: sitemap, error } = await supabase
      .from('sitemaps')
      .insert({
        site_id: data.siteId,
        url: data.url,
        type: data.type || 'sitemap',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return sitemap;
  },

  // Update sitemap with fetched data
  async updateWithData(
    id: string,
    data: {
      urls: Array<{ loc: string; lastmod?: string; changefreq?: string; priority?: string }>;
      type?: 'sitemap' | 'sitemap_index';
    }
  ): Promise<Sitemap> {
    const { data: sitemap, error } = await supabase
      .from('sitemaps')
      .update({
        urls: data.urls,
        total_urls: data.urls.length,
        type: data.type,
        last_fetched_at: new Date().toISOString(),
        status: 'completed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return sitemap;
  },

  // Mark as failed
  async markAsFailed(id: string, errorMessage: string): Promise<Sitemap> {
    const { data: sitemap, error } = await supabase
      .from('sitemaps')
      .update({
        status: 'failed',
        error_message: errorMessage,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return sitemap;
  },

  // Get sitemaps for a site
  async getBySiteId(siteId: string): Promise<Sitemap[]> {
    const { data, error } = await supabase
      .from('sitemaps')
      .select('*')
      .eq('site_id', siteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get sitemap by ID
  async getById(id: string): Promise<Sitemap | null> {
    const { data, error } = await supabase
      .from('sitemaps')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  },

  // Discover and create sitemaps for a site
  async discoverAndCreate(siteId: string, domain: string): Promise<Sitemap[]> {
    try {
      // Fetch robots.txt
      const robotsTxt = await this.fetchRobotsTxt(domain);
      
      if (!robotsTxt) {
        // Try default sitemap locations
        const defaultUrls = [
          `https://${domain}/sitemap.xml`,
          `https://${domain}/sitemap_index.xml`,
        ];
        
        const sitemaps: Sitemap[] = [];
        
        for (const url of defaultUrls) {
          try {
            const sitemap = await this.create({ siteId, url });
            sitemaps.push(sitemap);
          } catch (error) {
            // Ignore errors for default locations
          }
        }
        
        return sitemaps;
      }
      
      // Update site's robots.txt
      await supabase
        .from('sites')
        .update({ robots_txt: robotsTxt })
        .eq('id', siteId);
      
      // Extract sitemap URLs
      const sitemapUrls = this.extractSitemapUrls(robotsTxt);
      
      if (sitemapUrls.length === 0) {
        // Try default location
        sitemapUrls.push(`https://${domain}/sitemap.xml`);
      }
      
      // Create sitemap records
      const sitemaps: Sitemap[] = [];
      
      for (const url of sitemapUrls) {
        try {
          const sitemap = await this.create({ siteId, url });
          sitemaps.push(sitemap);
        } catch (error) {
          console.error(`Error creating sitemap for ${url}:`, error);
        }
      }
      
      return sitemaps;
    } catch (error) {
      console.error('Error discovering sitemaps:', error);
      return [];
    }
  },

  // Fetch and process a sitemap
  async fetchAndProcess(id: string): Promise<Sitemap> {
    const sitemap = await this.getById(id);
    if (!sitemap) throw new Error('Sitemap not found');

    try {
      // Update status to fetching
      await supabase
        .from('sitemaps')
        .update({ status: 'fetching' })
        .eq('id', id);

      // Fetch sitemap
      const result = await this.fetchSitemap(sitemap.url);
      
      if (!result) {
        return await this.markAsFailed(id, 'Failed to fetch sitemap');
      }

      // Update with data
      return await this.updateWithData(id, result);
    } catch (error: any) {
      return await this.markAsFailed(id, error.message);
    }
  },

  // Delete sitemap
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('sitemaps')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
