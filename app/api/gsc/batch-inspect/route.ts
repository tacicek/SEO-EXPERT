import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';
import type { BatchInspectRequest } from '@/lib/types/gsc';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json(
                { error: 'Missing Authorization header' },
                { status: 401 }
            );
        }

        const accessToken = authHeader.replace('Bearer ', '');
        const body: BatchInspectRequest = await req.json();

        const { siteUrl, sitemapUrl, urls, languageCode, limit } = body;

        if (!siteUrl) {
            return NextResponse.json(
                { error: 'Missing required parameter: siteUrl' },
                { status: 400 }
            );
        }

        if (!sitemapUrl && !urls) {
            return NextResponse.json(
                { error: 'Must provide either sitemapUrl or urls array' },
                { status: 400 }
            );
        }

        const gscService = new GoogleSearchConsoleService(accessToken);

        // Get URLs from sitemap or use provided URLs
        let urlsToInspect: string[] = [];
        if (sitemapUrl) {
            urlsToInspect = await gscService.fetchSitemapUrls(sitemapUrl, limit);
        } else if (urls) {
            urlsToInspect = limit ? urls.slice(0, limit) : urls;
        }

        if (urlsToInspect.length === 0) {
            return NextResponse.json(
                { error: 'No URLs to inspect' },
                { status: 400 }
            );
        }

        // Limit to prevent abuse
        const maxUrls = 100;
        if (urlsToInspect.length > maxUrls) {
            return NextResponse.json(
                {
                    error: `Too many URLs. Maximum ${maxUrls} URLs per batch. Use limit parameter to reduce.`,
                    urlCount: urlsToInspect.length,
                    maxUrls
                },
                { status: 400 }
            );
        }

        // Perform batch inspection
        const results = await gscService.batchInspectUrls(
            siteUrl,
            urlsToInspect,
            languageCode || 'en-US'
        );

        // Generate summary
        const summary = gscService.generateInspectionSummary(results);

        return NextResponse.json({
            results,
            summary,
        });
    } catch (error: any) {
        console.error('Failed to batch inspect URLs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to batch inspect URLs' },
            { status: 500 }
        );
    }
}
