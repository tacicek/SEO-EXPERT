import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';

export async function GET(req: NextRequest) {
    try {
        // In a real app with Supabase, we might get this from the session
        // For now, we expect the client to pass the provider token in the Authorization header
        // format: "Bearer <google_access_token>"
        const authHeader = req.headers.get('Authorization');

        if (!authHeader) {
            return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
        }

        const accessToken = authHeader.replace('Bearer ', '');
        const gscService = new GoogleSearchConsoleService(accessToken);
        const sites = await gscService.listSites();

        return NextResponse.json({ sites });
    } catch (error: any) {
        console.error('Failed to list sites:', error);
        return NextResponse.json({ error: error.message || 'Failed to list sites' }, { status: 500 });
    }
}
