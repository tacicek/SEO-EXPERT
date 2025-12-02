import { NextRequest, NextResponse } from 'next/server';
import {
  extractContentWithPlaywright,
  isBackendAvailable,
  convertToScrapedContent,
  type PlaywrightScrapeOptions,
} from '@/lib/services/playwright-scraper';

export interface PlaywrightScrapeRequest {
  url: string;
  usePlaywright?: boolean;
  timeoutMs?: number;
  scrollWaitMs?: number;
  finalWaitMs?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaywrightScrapeRequest = await request.json();
    const { 
      url, 
      usePlaywright = true, 
      timeoutMs = 45000, 
      scrollWaitMs = 1500, 
      finalWaitMs = 1000 
    } = body;

    // Validate URL
    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Check if backend is available
    const backendAvailable = await isBackendAvailable();
    if (!backendAvailable) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Playwright backend is not available. Please ensure the Python backend is running.' 
        },
        { status: 503 }
      );
    }

    // Extract content using Playwright with full DOM walker
    const options: PlaywrightScrapeOptions = {
      usePlaywright,
      timeoutMs,
      scrollWaitMs,
      finalWaitMs,
    };

    const extractedContent = await extractContentWithPlaywright(url, options);

    // Convert to format compatible with existing system
    const scrapedContent = convertToScrapedContent(extractedContent);

    return NextResponse.json({
      success: true,
      data: {
        extracted: extractedContent,
        scraped: scrapedContent,
      },
      message: `Successfully extracted content (${extractedContent.statistics.word_count} words)`,
    });
  } catch (error) {
    console.error('Playwright scrape API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Scraping failed',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Check backend status
  const backendAvailable = await isBackendAvailable();
  
  return NextResponse.json({
    service: 'Playwright Scraper API',
    backend_available: backendAvailable,
    endpoints: {
      scrape: 'POST /api/scrape/playwright',
    },
    description: 'Playwright-powered content extraction for JavaScript-rendered pages. Optimized for WordPress and modern JS sites.',
  });
}
