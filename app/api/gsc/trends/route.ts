import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = authHeader.substring(7);
        const { siteUrl, startDate, endDate, country } = await request.json();

        if (!siteUrl || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'siteUrl, startDate, and endDate are required' },
                { status: 400 }
            );
        }

        const gsc = new GoogleSearchConsoleService(accessToken);
        const trends = await gsc.getDateTrends(siteUrl, startDate, endDate, country);

        return NextResponse.json({ success: true, data: trends });
    } catch (error: any) {
        console.error('GSC trends error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch trends' },
            { status: 500 }
        );
    }
}

