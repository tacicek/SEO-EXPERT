import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';
import type { InspectUrlRequest } from '@/lib/types/gsc';

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
        const body: InspectUrlRequest = await req.json();

        const { siteUrl, inspectionUrl, languageCode } = body;

        if (!siteUrl || !inspectionUrl) {
            return NextResponse.json(
                { error: 'Missing required parameters: siteUrl and inspectionUrl' },
                { status: 400 }
            );
        }

        const gscService = new GoogleSearchConsoleService(accessToken);
        const result = await gscService.inspectUrl(
            siteUrl,
            inspectionUrl,
            languageCode || 'en-US'
        );

        return NextResponse.json(result);
    } catch (error: any) {
        console.error('Failed to inspect URL:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to inspect URL' },
            { status: 500 }
        );
    }
}
