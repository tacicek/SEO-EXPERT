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

        if (!brandTerms || !Array.isArray(brandTerms) || brandTerms.length === 0) {
            return NextResponse.json(
                { error: 'brandTerms array is required' },
                { status: 400 }
            );
        }

        const gsc = new GoogleSearchConsoleService(accessToken);
        const analysis = await gsc.getBrandedAnalysis(siteUrl, startDate, endDate, brandTerms);

        return NextResponse.json({ success: true, data: analysis });
    } catch (error: any) {
        console.error('GSC branded analysis error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to analyze branded queries' },
            { status: 500 }
        );
    }
}



