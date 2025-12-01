import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = authHeader.substring(7);
        const { siteUrl, startDate, endDate, dimensions, filters } = await request.json();

        if (!siteUrl || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'siteUrl, startDate, and endDate are required' },
                { status: 400 }
            );
        }

        const gsc = new GoogleSearchConsoleService(accessToken);
        
        // Fetch all data with pagination
        const rows = await gsc.getSearchAnalyticsAll(
            siteUrl,
            startDate,
            endDate,
            dimensions || ['QUERY', 'PAGE'],
            filters
        );

        // Generate CSV
        const csv = gsc.exportAnalyticsToCSV(rows, dimensions || ['query', 'page']);

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="gsc-export-${startDate}-${endDate}.csv"`,
            },
        });
    } catch (error: any) {
        console.error('GSC export error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to export data' },
            { status: 500 }
        );
    }
}

