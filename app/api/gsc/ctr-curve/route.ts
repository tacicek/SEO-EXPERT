import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = authHeader.substring(7);
        const { siteUrl, startDate, endDate, brandTerms } = await request.json();

        if (!siteUrl || !startDate || !endDate) {
            return NextResponse.json(
                { error: 'siteUrl, startDate, and endDate are required' },
                { status: 400 }
            );
        }

        const gsc = new GoogleSearchConsoleService(accessToken);
        const ctrCurve = await gsc.getCTRCurve(siteUrl, startDate, endDate, brandTerms);

        return NextResponse.json({ success: true, data: ctrCurve });
    } catch (error: any) {
        console.error('GSC CTR curve error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to calculate CTR curve' },
            { status: 500 }
        );
    }
}



