import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const accessToken = authHeader.replace('Bearer ', '');
        const { siteUrl, startDate, endDate, dimensions } = await req.json();

        if (!siteUrl || !startDate || !endDate) {
            return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
        }

        const gscService = new GoogleSearchConsoleService(accessToken);
        const data = await gscService.getSearchAnalytics(siteUrl, startDate, endDate, dimensions);

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Failed to fetch analytics:', error);
        return NextResponse.json({ error: error.message || 'Failed to fetch analytics' }, { status: 500 });
    }
}
