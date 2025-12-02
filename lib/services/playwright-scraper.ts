/**
 * Playwright-powered content scraper service.
 * Connects to the Python backend for JavaScript-rendered page extraction.
 */

export interface PlaywrightExtractedContent {
  url: string;
  extracted_at: string;
  title: string;
  meta_description: string;
  full_text: string;
  headings: Array<{
    level: number;
    tag: string;
    text: string;
    id: string;
    html: string;
  }>;
  paragraphs: Array<{
    text: string;
    html: string;
    word_count: number;
  }>;
  lists: Array<{
    type: 'ordered' | 'unordered';
    tag: string;
    items: Array<{
      text: string;
      html: string;
    }>;
    html: string;
  }>;
  tables: Array<{
    headers: string[];
    rows: string[][];
    html: string;
  }>;
  blockquotes: Array<{
    text: string;
    citation: string;
    html: string;
  }>;
  elements_in_order: Array<{
    type: string;
    tag: string;
    text: string;
    html: string;
    level?: number;
    list_type?: string;
    items?: string[];
  }>;
  html: string;
  statistics: {
    word_count: number;
    character_count: number;
    sentence_count: number;
  };
  used_playwright: boolean;
}

export interface PlaywrightScrapeOptions {
  usePlaywright?: boolean;
  waitForNetwork?: boolean;
  handleCookies?: boolean;
  blockResources?: boolean;
}

const DEFAULT_OPTIONS: PlaywrightScrapeOptions = {
  usePlaywright: true,
  waitForNetwork: true,
  handleCookies: true,
  blockResources: true,
};

/**
 * Get the Python backend URL from environment or use default.
 */
function getPythonBackendUrl(): string {
  return process.env.TECHNICAL_SEO_ANALYZER_URL || 
         process.env.PYTHON_BACKEND_URL ||
         'http://localhost:8000';
}

/**
 * Check if Python backend is available.
 */
export async function isBackendAvailable(): Promise<boolean> {
  try {
    const backendUrl = getPythonBackendUrl();
    const response = await fetch(`${backendUrl}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.status === 'healthy';
    }
    return false;
  } catch (error) {
    console.warn('Python backend not available:', error);
    return false;
  }
}

/**
 * Extract content from URL using Playwright via Python backend.
 */
export async function extractContentWithPlaywright(
  url: string,
  options: PlaywrightScrapeOptions = {}
): Promise<PlaywrightExtractedContent> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const backendUrl = getPythonBackendUrl();

  try {
    console.log(`Extracting content from ${url} using Playwright backend...`);
    
    const response = await fetch(`${backendUrl}/extract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        use_playwright: opts.usePlaywright,
        wait_for_network: opts.waitForNetwork,
        handle_cookies: opts.handleCookies,
        block_resources: opts.blockResources,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    const data: PlaywrightExtractedContent = await response.json();
    
    console.log(`Successfully extracted content: ${data.statistics.word_count} words, ${data.headings.length} headings`);
    
    return data;
  } catch (error) {
    console.error('Playwright extraction error:', error);
    throw new Error(
      `Failed to extract content: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Scrape URL with Playwright for full analysis.
 */
export async function scrapeWithPlaywright(
  url: string,
  options: PlaywrightScrapeOptions = {}
): Promise<{
  url: string;
  scraped_at: string;
  success: boolean;
  content: any;
  metadata: {
    word_count: number;
    character_count: number;
    sentence_count: number;
    headings_count: number;
    paragraphs_count: number;
    lists_count: number;
    tables_count: number;
    used_playwright: boolean;
  };
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const backendUrl = getPythonBackendUrl();

  try {
    const response = await fetch(`${backendUrl}/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        use_playwright: opts.usePlaywright,
        wait_for_network: opts.waitForNetwork,
        handle_cookies: opts.handleCookies,
        block_resources: opts.blockResources,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Playwright scrape error:', error);
    throw new Error(
      `Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Run full technical SEO analysis with Playwright.
 */
export async function analyzeWithPlaywright(
  url: string,
  options: PlaywrightScrapeOptions = {}
): Promise<{
  url: string;
  analyzed_at: string;
  score: Record<string, number>;
  meta: any;
  headings: any;
  images: any;
  url_structure: any;
  schema_markup: any;
  content_quality: any;
  issues: Array<{
    type: string;
    message: string;
    impact: 'high' | 'medium' | 'low';
    recommendation?: string;
  }>;
  recommendations: string[];
  extracted_content: PlaywrightExtractedContent | null;
}> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const backendUrl = getPythonBackendUrl();

  try {
    const response = await fetch(`${backendUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url,
        use_playwright: opts.usePlaywright,
        wait_for_network: opts.waitForNetwork,
        handle_cookies: opts.handleCookies,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Backend error (${response.status}): ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Playwright analysis error:', error);
    throw new Error(
      `Failed to analyze URL: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Convert Playwright extracted content to format compatible with existing system.
 */
export function convertToScrapedContent(extracted: PlaywrightExtractedContent): {
  title: string;
  content: string;
  htmlContent: string;
  rawMainHtml: string;
  contentElements: Array<{
    type: 'paragraph' | 'heading' | 'list' | 'blockquote' | 'list-item';
    tag: string;
    level?: number;
    html: string;
    text: string;
    children?: any[];
    links: any[];
  }>;
  description: string;
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
    items: any[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  wordCount: number;
  characterCount: number;
  sentenceCount: number;
} {
  // Group headings by level
  const headings: Record<string, string[]> = {
    h1: [],
    h2: [],
    h3: [],
    h4: [],
    h5: [],
    h6: [],
  };

  for (const heading of extracted.headings) {
    const key = `h${heading.level}`;
    if (headings[key]) {
      headings[key].push(heading.text);
    }
  }

  // Convert elements_in_order to contentElements format
  const contentElements = extracted.elements_in_order.map(elem => {
    let type: 'paragraph' | 'heading' | 'list' | 'blockquote' | 'list-item' = 'paragraph';
    
    if (elem.type === 'heading') {
      type = 'heading';
    } else if (elem.type === 'list') {
      type = 'list';
    } else if (elem.type === 'blockquote') {
      type = 'blockquote';
    }

    return {
      type,
      tag: elem.tag,
      level: elem.level,
      html: elem.html,
      text: elem.text,
      children: elem.items?.map(item => ({
        type: 'list-item' as const,
        tag: 'li',
        html: item,
        text: item,
        links: [],
      })),
      links: [],
    };
  });

  return {
    title: extracted.title,
    content: extracted.full_text,
    htmlContent: extracted.html,
    rawMainHtml: extracted.html,
    contentElements,
    description: extracted.meta_description,
    url: extracted.url,
    headings: headings as any,
    links: {
      internal: 0, // Will be calculated from HTML if needed
      external: 0,
      total: 0,
      items: [],
    },
    images: {
      total: 0,
      withAlt: 0,
      withoutAlt: 0,
    },
    wordCount: extracted.statistics.word_count,
    characterCount: extracted.statistics.character_count,
    sentenceCount: extracted.statistics.sentence_count,
  };
}

export const playwrightScraperService = {
  isBackendAvailable,
  extractContentWithPlaywright,
  scrapeWithPlaywright,
  analyzeWithPlaywright,
  convertToScrapedContent,
};

export default playwrightScraperService;

