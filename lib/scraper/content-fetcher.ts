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
  type: 'paragraph' | 'heading' | 'list' | 'blockquote' | 'list-item';
  tag: string;
  level?: number; // For headings (1-6)
  html: string;
  text: string;
  children?: ContentElement[]; // For nested structures like lists
  links: ContentLink[];
}

export interface ScrapedContent {
  title: string;
  content: string;
  htmlContent: string; // Full preserved HTML of main content
  rawMainHtml: string; // Raw HTML of main content area (for editor)
  contentElements: ContentElement[]; // Structured content elements
  description?: string;
  url: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    h4: string[];
    h5: string[];
    h6: string[];
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
    $('script, style, noscript, iframe').remove();

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
      '.post-body',
      '.article-body',
      '.single-content',
      '.blog-post',
    ];

    let $mainContent: cheerio.Cheerio<any> | null = null;
    for (const selector of mainSelectors) {
      const $candidate = $(selector).first();
      if ($candidate.length > 0 && $candidate.text().trim().length > 200) {
        $mainContent = $candidate;
        break;
      }
    }

    // If no main content found, use body
    if (!$mainContent || $mainContent.length === 0) {
      $mainContent = $('body');
    }

    // Remove navigation, header, footer, sidebar from main content clone
    const $contentClone = $mainContent.clone();
    $contentClone.find('nav, header, footer, aside, .nav, .header, .footer, .sidebar, .navigation, .menu, .comments, .related-posts, .share-buttons, .social-share, .advertisement, .ad, [role="navigation"], [role="complementary"]').remove();

    // Get raw HTML of the main content (for editor display)
    const rawMainHtml = cleanHtmlForEditor($contentClone.html() || '', url, urlObj.hostname);

    // Extract structured content elements
    const contentElements: ContentElement[] = [];
    const linkItems: ContentLink[] = [];
    let content = '';
    let textPosition = 0;

    // Process content elements in order
    $contentClone.find('> *').each((_, elem) => {
      const element = processElement($, elem, url, urlObj.hostname, textPosition);
      if (element) {
        contentElements.push(element.element);
        content += element.text + '\n\n';
        textPosition += element.text.length + 2;
        linkItems.push(...element.links);
      }
    });

    // Also process direct children that might be text nodes or inline elements
    // If content is still empty, try a different approach
    if (contentElements.length === 0 || content.trim().length < 100) {
      content = '';
      textPosition = 0;
      contentElements.length = 0;
      linkItems.length = 0;

      // Process all meaningful content elements
      $contentClone.find('h1, h2, h3, h4, h5, h6, p, ul, ol, blockquote, table, pre, figure').each((_, elem) => {
        const element = processElement($, elem, url, urlObj.hostname, textPosition);
        if (element) {
          contentElements.push(element.element);
          content += element.text + '\n\n';
          textPosition += element.text.length + 2;
          linkItems.push(...element.links);
        }
      });
    }

    content = content.trim();

    // Build clean HTML content for editor
    const htmlContent = buildCleanHtml(contentElements, url, urlObj.hostname);

    // Extract all headings
    const headings = {
      h1: $mainContent.find('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h2: $mainContent.find('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h3: $mainContent.find('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h4: $mainContent.find('h4').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h5: $mainContent.find('h5').map((_, el) => $(el).text().trim()).get().filter(Boolean),
      h6: $mainContent.find('h6').map((_, el) => $(el).text().trim()).get().filter(Boolean),
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
      rawMainHtml,
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

// Process a single element and return structured data
function processElement(
  $: cheerio.CheerioAPI,
  elem: any,
  baseUrl: string,
  hostname: string,
  textPosition: number
): { element: ContentElement; text: string; links: ContentLink[] } | null {
  const $elem = $(elem);
  const tagName = elem.tagName?.toLowerCase() || 'div';
  
  // Skip if empty or whitespace only
  const text = $elem.text().trim();
  if (!text || text.length < 2) return null;

  const links: ContentLink[] = [];

  // Extract links from element
  $elem.find('a[href]').each((_, link) => {
    const $link = $(link);
    const href = $link.attr('href') || '';
    const linkText = $link.text().trim();
    
    if (!href || !linkText || href.startsWith('#')) return;
    
    let linkType: 'internal' | 'external' = 'internal';
    try {
      const linkUrl = new URL(href, baseUrl);
      linkType = linkUrl.hostname === hostname ? 'internal' : 'external';
    } catch {
      linkType = 'internal';
    }
    
    const linkStartIndex = text.indexOf(linkText);
    links.push({
      href,
      text: linkText,
      type: linkType,
      startIndex: textPosition + (linkStartIndex >= 0 ? linkStartIndex : 0),
      endIndex: textPosition + (linkStartIndex >= 0 ? linkStartIndex : 0) + linkText.length,
    });
  });

  // Process based on tag type
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tagName)) {
    const level = parseInt(tagName.charAt(1));
    return {
      element: {
        type: 'heading',
        tag: tagName,
        level,
        html: processHtmlLinks($, $elem.html() || text, baseUrl, hostname),
        text,
        links,
      },
      text,
      links,
    };
  }

  if (tagName === 'ul' || tagName === 'ol') {
    // Process list with all items
    const listItems: ContentElement[] = [];
    let listText = '';
    
    $elem.children('li').each((_, li) => {
      const $li = $(li);
      const liText = $li.text().trim();
      if (liText) {
        const liLinks: ContentLink[] = [];
        
        $li.find('a[href]').each((_, link) => {
          const $link = $(link);
          const href = $link.attr('href') || '';
          const linkText = $link.text().trim();
          
          if (!href || !linkText || href.startsWith('#')) return;
          
          let linkType: 'internal' | 'external' = 'internal';
          try {
            const linkUrl = new URL(href, baseUrl);
            linkType = linkUrl.hostname === hostname ? 'internal' : 'external';
          } catch {
            linkType = 'internal';
          }
          
          liLinks.push({
            href,
            text: linkText,
            type: linkType,
            startIndex: textPosition + listText.length,
            endIndex: textPosition + listText.length + linkText.length,
          });
          links.push(...liLinks);
        });

        listItems.push({
          type: 'list-item',
          tag: 'li',
          html: processHtmlLinks($, $li.html() || liText, baseUrl, hostname),
          text: liText,
          links: liLinks,
        });
        listText += '• ' + liText + '\n';
      }
    });

    if (listItems.length === 0) return null;

    // Build list HTML
    const listHtml = `<${tagName}>${listItems.map(item => `<li>${item.html}</li>`).join('')}</${tagName}>`;

    return {
      element: {
        type: 'list',
        tag: tagName,
        html: listHtml,
        text: listText.trim(),
        children: listItems,
        links,
      },
      text: listText.trim(),
      links,
    };
  }

  if (tagName === 'blockquote') {
    return {
      element: {
        type: 'blockquote',
        tag: tagName,
        html: processHtmlLinks($, $elem.html() || text, baseUrl, hostname),
        text,
        links,
      },
      text,
      links,
    };
  }

  // Default: paragraph
  if (['p', 'div', 'span', 'section', 'article'].includes(tagName)) {
    // Check if this is a wrapper element
    const directText = $elem.contents().filter(function() {
      return this.type === 'text';
    }).text().trim();
    
    // If element has substantial direct text or is a paragraph, include it
    if (tagName === 'p' || directText.length > 10) {
      return {
        element: {
          type: 'paragraph',
          tag: 'p',
          html: processHtmlLinks($, $elem.html() || text, baseUrl, hostname),
          text,
          links,
        },
        text,
        links,
      };
    }
  }

  // For other elements with content, treat as paragraph
  if (text.length > 20) {
    return {
      element: {
        type: 'paragraph',
        tag: 'p',
        html: processHtmlLinks($, $elem.html() || text, baseUrl, hostname),
        text,
        links,
      },
      text,
      links,
    };
  }

  return null;
}

// Process HTML to add link type attributes
function processHtmlLinks($: cheerio.CheerioAPI, html: string, baseUrl: string, hostname: string): string {
  const $temp = cheerio.load(`<div>${html}</div>`);
  
  $temp('a[href]').each((_, link) => {
    const $link = $temp(link);
    const href = $link.attr('href') || '';
    
    if (!href || href.startsWith('#')) return;
    
    let linkType = 'internal';
    try {
      const linkUrl = new URL(href, baseUrl);
      linkType = linkUrl.hostname === hostname ? 'internal' : 'external';
    } catch {
      linkType = 'internal';
    }
    
    $link.attr('data-link-type', linkType);
    $link.addClass(`link-${linkType}`);
  });
  
  return $temp('div').html() || html;
}

// Build clean HTML from content elements
function buildCleanHtml(elements: ContentElement[], baseUrl: string, hostname: string): string {
  let html = '';
  
  for (const element of elements) {
    switch (element.type) {
      case 'heading':
        html += `<${element.tag}>${element.html}</${element.tag}>\n`;
        break;
      case 'list':
        html += `${element.html}\n`;
        break;
      case 'blockquote':
        html += `<blockquote>${element.html}</blockquote>\n`;
        break;
      case 'paragraph':
      default:
        html += `<p>${element.html}</p>\n`;
        break;
    }
  }
  
  return html.trim();
}

// Clean HTML for editor display
function cleanHtmlForEditor(html: string, baseUrl: string, hostname: string): string {
  if (!html) return '';
  
  const $ = cheerio.load(`<div>${html}</div>`);
  
  // Remove unwanted elements
  $('script, style, noscript, iframe, form, input, button, .ad, .advertisement, .share, .social').remove();
  
  // Add link type attributes
  $('a[href]').each((_, link) => {
    const $link = $(link);
    const href = $link.attr('href') || '';
    
    if (!href || href.startsWith('#')) return;
    
    let linkType = 'internal';
    try {
      const linkUrl = new URL(href, baseUrl);
      linkType = linkUrl.hostname === hostname ? 'internal' : 'external';
    } catch {
      linkType = 'internal';
    }
    
    $link.attr('data-link-type', linkType);
    $link.addClass(`link-${linkType}`);
  });
  
  // Ensure images have src attributes
  $('img').each((_, img) => {
    const $img = $(img);
    const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-lazy-src');
    if (src) {
      try {
        const absoluteSrc = new URL(src, baseUrl).href;
        $img.attr('src', absoluteSrc);
      } catch {
        // Keep original src
      }
    }
  });
  
  return $('div').html() || '';
}

export function extractTextFromHTML(html: string): string {
  const $ = cheerio.load(html);
  
  // Remove unwanted elements
  $('script, style, noscript, iframe, nav, header, footer, aside').remove();
  
  // Extract text
  let text = '';
  $('p, h1, h2, h3, h4, h5, h6, li, td, th, blockquote').each((_, elem) => {
    const elementText = $(elem).text().trim();
    if (elementText) {
      text += elementText + '\n\n';
    }
  });
  
  return text.trim();
}
