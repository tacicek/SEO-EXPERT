import { NextRequest, NextResponse } from 'next/server';
import { serperService } from '@/lib/services/serper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Validate URL
    if (!serperService.isScrapableUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid or unsupported URL format' },
        { status: 400 }
      );
    }

    // Scrape the URL
    const scrapeResult = await serperService.scrapeUrl(url);

    // Extract text and metadata
    const textContent = serperService.extractTextContent(scrapeResult);
    const metadata = serperService.extractMetadata(scrapeResult);

    return NextResponse.json({
      success: true,
      data: {
        url,
        text: textContent,
        metadata,
        raw: scrapeResult, // Include raw response for debugging
      },
    });
  } catch (error: any) {
    console.error('Serper scrape API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to scrape URL',
      },
      { status: 500 }
    );
  }
}
