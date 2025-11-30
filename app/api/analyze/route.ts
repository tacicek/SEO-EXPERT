import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/ai/analyzer';
import { fetchAndParseURL } from '@/lib/scraper/content-fetcher';
import type { AnalysisRequest, AnalysisResponse } from '@/lib/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { url, content, title, topic } = body;

    // Validate input
    if (!url && !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Either URL or content must be provided',
        } as AnalysisResponse,
        { status: 400 }
      );
    }

    let textToAnalyze = content || '';
    let titleToUse = title || '';

    // If URL is provided, fetch content
    if (url) {
      try {
        const scrapedContent = await fetchAndParseURL(url);
        textToAnalyze = scrapedContent.content;
        titleToUse = title || scrapedContent.title;

        // Validate content length
        if (textToAnalyze.length < 100) {
          return NextResponse.json(
            {
              success: false,
              error: 'Content is too short to analyze (minimum 100 characters)',
            } as AnalysisResponse,
            { status: 400 }
          );
        }

        // Check max length
        const maxLength = parseInt(process.env.MAX_CONTENT_LENGTH || '50000');
        if (textToAnalyze.length > maxLength) {
          textToAnalyze = textToAnalyze.substring(0, maxLength);
        }
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
          } as AnalysisResponse,
          { status: 400 }
        );
      }
    }

    // Perform AI analysis
    const analysisResult = await analyzeContent(textToAnalyze, titleToUse);

    // Add URL to result if provided
    if (url) {
      analysisResult.url = url;
    }

    return NextResponse.json(
      {
        success: true,
        data: analysisResult,
        message: 'Analysis completed successfully',
      } as AnalysisResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Analysis API Error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
      } as AnalysisResponse,
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: 'Method not allowed. Use POST to analyze content.',
    },
    { status: 405 }
  );
}
