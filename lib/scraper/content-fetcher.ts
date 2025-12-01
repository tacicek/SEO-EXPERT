import * as cheerio from 'cheerio';
import { serperService } from '../services/serper';

export interface ContentLink {
  href: string;
  text: string;
  type: 'internal' | 'external';
  startIndex: number;
  endIndex: number;
}

export interface ContentElement {
  type: 'paragraph' | 'heading' | 'list' | 'blockquote';
  tag: string;
  html: string;
  text: string;
  links: ContentLink[];
}

export interface ScrapedContent {
  title: string;
  content: string;
  htmlContent: string; // Preserved HTML with formatting
  contentElements: ContentElement[]; // Structured content elements
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
    items: ContentLink[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
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

    // Remove script and style tags but keep content tags
    $('script, style, noscript, iframe, nav, header, footer, aside, .nav, .header, .footer, .sidebar').remove();

    // Extract title
    const title = $('title').first().text().trim() || 
                  $('h1').first().text().trim() || 
                  'Untitled';

    // Extract meta description
    const description = $('meta[name="description"]').attr('content') || 
                       $('meta[property="og:description"]').attr('content') || 
                       '';

    // Try to find main content area
    const mainSelectors = [
      'article',
      'main',
      '[role="main"]',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.content-area',
      '#content',
      '.content',
      '.page-content',
      '.main-content',
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

    // Extract structured content with HTML preservation
    const contentElements: ContentElement[] = [];
    const linkItems: ContentLink[] = [];
    let content = '';
    let textPosition = 0;

    // Process content elements
    $mainContent.find('p, h1, h2, h3, h4, h5, h6, li, blockquote').each((_, elem) => {
      const $elem = $(elem);
      const tagName = elem.tagName?.toLowerCase() || 'p';
      const text = $elem.text().trim();
      
      if (!text || text.length < 3) return;
      
      // Get HTML with formatting preserved
      let elementHtml = $elem.html() || '';
      
      // Process links within this element
      const elementLinks: ContentLink[] = [];
      $elem.find('a[href]').each((_, link) => {
        const $link = $(link);
        const href = $link.attr('href') || '';
        const linkText = $link.text().trim();
        
        if (!href || !linkText) return;
        
        let linkType: 'internal' | 'external' = 'internal';
        try {
          const linkUrl = new URL(href, url);
          linkType = linkUrl.hostname === urlObj.hostname ? 'internal' : 'external';
        } catch {
          linkType = 'internal';
        }
        
        const linkStartIndex = text.indexOf(linkText);
        elementLinks.push({
          href,
          text: linkText,
          type: linkType,
          startIndex: textPosition + (linkStartIndex >= 0 ? linkStartIndex : 0),
          endIndex: textPosition + (linkStartIndex >= 0 ? linkStartIndex : 0) + linkText.length,
        });
        
        linkItems.push({
          href,
          text: linkText,
          type: linkType,
          startIndex: textPosition + (linkStartIndex >= 0 ? linkStartIndex : 0),
          endIndex: textPosition + (linkStartIndex >= 0 ? linkStartIndex : 0) + linkText.length,
        });
      });

      // Determine element type
      let type: ContentElement['type'] = 'paragraph';
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
        type = 'heading';
      } else if (tagName === 'li') {
        type = 'list';
      } else if (tagName === 'blockquote') {
        type = 'blockquote';
      }

      contentElements.push({
        type,
        tag: tagName,
        html: elementHtml,
        text,
        links: elementLinks,
      });

      content += text + '\n\n';
      textPosition += text.length + 2;
    });

    content = content.trim();

    // Build HTML content with proper link styling markers
    let htmlContent = '';
    for (const element of contentElements) {
      let processedHtml = element.html;
      
      // Add data attributes to links for styling
      const $tempEl = cheerio.load(`<div>${processedHtml}</div>`);
      $tempEl('a[href]').each((_, link) => {
        const $link = $tempEl(link);
        const href = $link.attr('href') || '';
        let linkType = 'internal';
        try {
          const linkUrl = new URL(href, url);
          linkType = linkUrl.hostname === urlObj.hostname ? 'internal' : 'external';
        } catch {
          linkType = 'internal';
        }
        $link.attr('data-link-type', linkType);
        $link.addClass(`link-${linkType}`);
      });
      processedHtml = $tempEl('div').html() || processedHtml;
      
      htmlContent += `<${element.tag}>${processedHtml}</${element.tag}>`;
    }

    // Extract headings
    const headings = {
      h1: $mainContent.find('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h2: $mainContent.find('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h3: $mainContent.find('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean),
    };

    // Count links by type
    const internalLinks = linkItems.filter(l => l.type === 'internal').length;
    const externalLinks = linkItems.filter(l => l.type === 'external').length;

    // Analyze images
    const allImages = $mainContent.find('img');
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

    // Calculate statistics
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    const characterCount = content.replace(/\s/g, '').length;
    const sentenceCount = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    return {
      title,
      content,
      htmlContent,
      contentElements,
      description,
      url,
      headings,
      links: {
        internal: internalLinks,
        external: externalLinks,
        total: internalLinks + externalLinks,
        items: linkItems,
      },
      images: {
        total: allImages.length,
        withAlt: imagesWithAlt,
        withoutAlt: imagesWithoutAlt,
      },
      wordCount,
      characterCount,
      sentenceCount,
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
