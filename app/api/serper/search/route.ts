import { NextRequest, NextResponse } from 'next/server';
import { serperService } from '@/lib/services/serper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { q, gl, hl, num, page } = body;

    if (!q) {
      return NextResponse.json(
        { error: 'Search query (q) is required' },
        { status: 400 }
      );
    }

    // Search Google
    const searchResult = await serperService.searchGoogle({
      q,
      gl: gl || 'us',
      hl: hl || 'en',
      num: num || 10,
      page: page || 1,
    });

    return NextResponse.json({
      success: true,
      data: searchResult,
    });
  } catch (error: any) {
    console.error('Serper search API error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to perform search',
      },
      { status: 500 }
    );
  }
}
