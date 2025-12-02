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
  waitForNetwork?: boolean;
  handleCookies?: boolean;
  blockResources?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body: PlaywrightScrapeRequest = await request.json();
    const { url, usePlaywright = true, waitForNetwork = true, handleCookies = true, blockResources = true } = body;

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

    // Extract content using Playwright
    const options: PlaywrightScrapeOptions = {
      usePlaywright,
      waitForNetwork,
      handleCookies,
      blockResources,
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
    description: 'Playwright-powered content extraction for JavaScript-rendered pages',
  });
}

