import { NextRequest, NextResponse } from 'next/server';
import { analyzeContent } from '@/lib/ai/analyzer';
import { fetchAndParseURL, type ScrapedContent } from '@/lib/scraper/content-fetcher';
import type { AnalysisRequest, AnalysisResponse, ContentLinkInfo, ContentElementInfo } from '@/lib/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { url, content, title } = body;

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
    let scrapedData: ScrapedContent | null = null;

    // If URL is provided, fetch content with HTML preservation
    if (url) {
      try {
        scrapedData = await fetchAndParseURL(url);
        textToAnalyze = scrapedData.content;
        titleToUse = title || scrapedData.title;

        console.log('Scraped content info:', {
          title: scrapedData.title,
          contentLength: scrapedData.content.length,
          htmlContentLength: scrapedData.htmlContent?.length || 0,
          rawMainHtmlLength: scrapedData.rawMainHtml?.length || 0,
          contentElementsCount: scrapedData.contentElements?.length || 0,
          wordCount: scrapedData.wordCount,
          headings: {
            h1: scrapedData.headings.h1.length,
            h2: scrapedData.headings.h2.length,
            h3: scrapedData.headings.h3.length,
          },
        });

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

    // Add URL and scraped data to result
    if (url) {
      analysisResult.url = url;
    }

    // Add HTML content, structured elements, and links if we scraped from URL
    if (scrapedData) {
      // Add processed HTML content
      analysisResult.htmlContent = scrapedData.htmlContent;
      
      // Add raw HTML for editor display (preserves full structure)
      analysisResult.rawMainHtml = scrapedData.rawMainHtml;
      
      // Add structured content elements
      analysisResult.contentElements = scrapedData.contentElements.map(el => ({
        type: el.type,
        tag: el.tag,
        level: el.level,
        html: el.html,
        text: el.text,
        children: el.children?.map(child => ({
          type: child.type,
          tag: child.tag,
          html: child.html,
          text: child.text,
        })),
      })) as ContentElementInfo[];
      
      // Add headings info
      analysisResult.headings = scrapedData.headings;
      
      // Convert links to the expected format
      const links: ContentLinkInfo[] = scrapedData.links.items.map(link => ({
        href: link.href,
        text: link.text,
        type: link.type,
      }));
      analysisResult.links = links;

      // Update statistics with accurate counts from scraper
      analysisResult.statistics = {
        ...analysisResult.statistics,
        word_count: scrapedData.wordCount,
        character_count: scrapedData.characterCount,
        total_sentences: scrapedData.sentenceCount > 0 ? scrapedData.sentenceCount : analysisResult.statistics.total_sentences,
      };

      // Update link analysis
      analysisResult.link_analysis = {
        internal_links: scrapedData.links.internal,
        external_links: scrapedData.links.external,
        broken_links: 0,
        nofollow_count: 0,
        unique_domains: new Set(links.filter(l => l.type === 'external').map(l => {
          try {
            return new URL(l.href).hostname;
          } catch {
            return '';
          }
        })).size,
        anchor_text_diversity: new Set(links.map(l => l.text)).size / Math.max(links.length, 1),
      };
    }

    // Recalculate sentence statistics
    const greenCount = analysisResult.sentence_analysis.filter(s => s.score === 'green').length;
    const orangeCount = analysisResult.sentence_analysis.filter(s => s.score === 'orange').length;
    const redCount = analysisResult.sentence_analysis.filter(s => s.score === 'red').length;
    const totalSentences = analysisResult.sentence_analysis.length;

    analysisResult.statistics = {
      ...analysisResult.statistics,
      total_sentences: totalSentences,
      green_count: greenCount,
      orange_count: orangeCount,
      red_count: redCount,
      green_percentage: totalSentences > 0 ? Math.round((greenCount / totalSentences) * 100) : 0,
    };

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
