import type {
  SerperScrapeRequest,
  SerperScrapeResponse,
  SerperSearchRequest,
  SerperSearchResponse,
  SerperError,
} from '../types/serper';

const SERPER_API_KEY = process.env.SERPER_API_KEY;
const SERPER_SCRAPE_URL = 'https://scrape.serper.dev';
const SERPER_SEARCH_URL = 'https://google.serper.dev/search';

if (!SERPER_API_KEY) {
  console.warn('SERPER_API_KEY is not set in environment variables');
}

/**
 * Scrape content from a URL using Serper.dev
 */
export async function scrapeUrl(
  url: string
): Promise<SerperScrapeResponse> {
  if (!SERPER_API_KEY) {
    throw new Error('Serper API key is not configured');
  }

  try {
    const response = await fetch(SERPER_SCRAPE_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Serper API error: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Serper scrape error:', error);
    throw error;
  }
}

/**
 * Search Google using Serper.dev
 */
export async function searchGoogle(
  params: SerperSearchRequest
): Promise<SerperSearchResponse> {
  if (!SERPER_API_KEY) {
    throw new Error('Serper API key is not configured');
  }

  try {
    const requestBody = {
      q: params.q,
      gl: params.gl || 'us',
      hl: params.hl || 'en',
      num: params.num || 10,
      page: params.page || 1,
    };

    const response = await fetch(SERPER_SEARCH_URL, {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Serper API error: ${response.status}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Serper search error:', error);
    throw error;
  }
}

/**
 * Extract clean text content from scraped HTML
 */
export function extractTextContent(scrapeResponse: SerperScrapeResponse): string {
  // Prefer text content if available
  if (scrapeResponse.text) {
    return scrapeResponse.text;
  }

  // Fallback to HTML if text is not available
  if (scrapeResponse.html) {
    // Simple HTML tag removal (you might want to use a library like cheerio for better parsing)
    return scrapeResponse.html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return '';
}

/**
 * Get metadata from scraped content
 */
export function extractMetadata(scrapeResponse: SerperScrapeResponse) {
  return {
    title: scrapeResponse.title || '',
    description: scrapeResponse.description || '',
    author: scrapeResponse.author || '',
    date: scrapeResponse.date || '',
    image: scrapeResponse.image || '',
    favicon: scrapeResponse.favicon || '',
    lang: scrapeResponse.lang || 'en',
  };
}

/**
 * Check if URL is scrapable
 */
export function isScrapableUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol;
    
    // Only allow http and https
    if (protocol !== 'http:' && protocol !== 'https:') {
      return false;
    }

    // Block certain file extensions
    const blockedExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    const pathname = urlObj.pathname.toLowerCase();
    
    for (const ext of blockedExtensions) {
      if (pathname.endsWith(ext)) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Serper service with all methods
 */
export const serperService = {
  scrapeUrl,
  searchGoogle,
  extractTextContent,
  extractMetadata,
  isScrapableUrl,
};
