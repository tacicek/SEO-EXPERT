import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';
import type { FetchSitemapUrlsRequest } from '@/lib/types/gsc';

export async function POST(req: NextRequest) {
    try {
        const body: FetchSitemapUrlsRequest = await req.json();
        const { sitemapUrl, limit } = body;

        if (!sitemapUrl) {
            return NextResponse.json(
                { error: 'Missing required parameter: sitemapUrl' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(sitemapUrl);
        } catch {
            return NextResponse.json(
                { error: 'Invalid sitemap URL format' },
                { status: 400 }
            );
        }

        // Create a temporary service instance (no auth needed for public sitemaps)
        const gscService = new GoogleSearchConsoleService('dummy-token');
        const urls = await gscService.fetchSitemapUrls(sitemapUrl, limit);

        return NextResponse.json({
            urls,
            total: urls.length,
        });
    } catch (error: any) {
        console.error('Failed to fetch sitemap URLs:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch sitemap URLs' },
            { status: 500 }
        );
    }
}
