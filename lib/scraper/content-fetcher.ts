import * as cheerio from 'cheerio';
import { serperService } from '../services/serper';

export interface ScrapedContent {
  title: string;
  content: string;
  description?: string;
  url: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: {
    internal: number;
    external: number;
    total: number;
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  wordCount: number;
}

export async function fetchAndParseURL(url: string): Promise<ScrapedContent> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    
    // Try to use Serper first if available
    const useSerper = process.env.SERPER_API_KEY && serperService.isScrapableUrl(url);
    
    let html: string;
    let serperMetadata: any = null;

    if (useSerper) {
      try {
        console.log('Using Serper.dev to scrape URL:', url);
        const scrapeResult = await serperService.scrapeUrl(url);
        
        // Get metadata from Serper
        serperMetadata = serperService.extractMetadata(scrapeResult);
        
        // Prefer HTML for better parsing if available
        html = scrapeResult.html || '';
        
        // If no HTML, construct minimal HTML from text
        if (!html && scrapeResult.text) {
          html = `<html><body>${scrapeResult.text.split('\n').map(p => `<p>${p}</p>`).join('')}</body></html>`;
        }
      } catch (serperError) {
        console.warn('Serper scraping failed, falling back to direct fetch:', serperError);
        // Fallback to direct fetch
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'SEO-Expert-AI-Bot/1.0 (Content Analysis Tool)',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
        }

        html = await response.text();
      }
    } else {
      // Direct fetch (no Serper)
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'SEO-Expert-AI-Bot/1.0 (Content Analysis Tool)',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      html = await response.text();
    }

    const $ = cheerio.load(html);

    // Remove script and style tags
    $('script, style, noscript').remove();

    // Extract title
    const title = $('title').first().text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    // Extract main content
    let content = '';
    
    // Try to find main content area
    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '#content',
      '.content',
    ];

    let $mainContent = null;
    for (const selector of mainSelectors) {
      $mainContent = $(selector).first();
      if ($mainContent.length > 0) {
        break;
      }
    }

    // If no main content found, use body
    if (!$mainContent || $mainContent.length === 0) {
      $mainContent = $('body');
    }

    // Extract text content, preserving paragraph structure
    $mainContent.find('p, h1, h2, h3, h4, h5, h6, li').each((_, elem) => {
      const text = $(elem).text().trim();
      if (text) {
        content += text + '\n\n';
      }
    });

    content = content.trim();

    // Extract headings
    const headings = {
      h1: $('h1').map((_, el) => $(el).text().trim()).get(),
      h2: $('h2').map((_, el) => $(el).text().trim()).get(),
      h3: $('h3').map((_, el) => $(el).text().trim()).get(),
    };

    // Analyze links
    const allLinks = $('a[href]');
    let internalLinks = 0;
    let externalLinks = 0;

    allLinks.each((_, elem) => {
      const href = $(elem).attr('href') || '';
      try {
        const linkUrl = new URL(href, url);
        if (linkUrl.hostname === urlObj.hostname) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      } catch {
        // Relative link or invalid
        internalLinks++;
      }
    });

    // Analyze images
    const allImages = $('img');
    let imagesWithAlt = 0;
    let imagesWithoutAlt = 0;

    allImages.each((_, elem) => {
      const alt = $(elem).attr('alt');
      if (alt && alt.trim()) {
        imagesWithAlt++;
      } else {
        imagesWithoutAlt++;
      }
    });

    // Calculate word count
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;

    return {
      title,
      content,
      description,
      url,
      headings,
      links: {
        internal: internalLinks,
        external: externalLinks,
        total: internalLinks + externalLinks,
      },
      images: {
        total: allImages.length,
        withAlt: imagesWithAlt,
        withoutAlt: imagesWithoutAlt,
      },
      wordCount,
    };
  } catch (error) {
    console.error('Content Fetcher Error:', error);
    throw new Error(`Failed to fetch content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractTextFromHTML(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, noscript, iframe, nav, header, footer, aside').remove();
  
  // Extract text
  let text = '';
  $('p, h1, h2, h3, h4, h5, h6, li, td, th').each((_, elem) => {
    const elementText = $(elem).text().trim();
    if (elementText) {
      text += elementText + '\n\n';
    }
  });
  
  return text.trim();
}
