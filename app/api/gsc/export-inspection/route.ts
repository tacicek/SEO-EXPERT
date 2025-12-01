import { NextRequest, NextResponse } from 'next/server';
import { GoogleSearchConsoleService } from '@/lib/google/search-console';
import type { ExportInspectionRequest } from '@/lib/types/gsc';

export async function POST(req: NextRequest) {
    try {
        const body: ExportInspectionRequest = await req.json();
        const { results, format, filename } = body;

        if (!results || !Array.isArray(results) || results.length === 0) {
            return NextResponse.json(
                { error: 'Missing or invalid results array' },
                { status: 400 }
            );
        }

        if (!format || !['csv', 'json'].includes(format)) {
            return NextResponse.json(
                { error: 'Invalid format. Must be "csv" or "json"' },
                { status: 400 }
            );
        }

        const gscService = new GoogleSearchConsoleService('dummy-token');
        const timestamp = new Date().toISOString().split('T')[0];
        const defaultFilename = `gsc-inspection-${timestamp}`;

        let content: string;
        let contentType: string;
        let fileExtension: string;

        if (format === 'csv') {
            content = gscService.exportToCSV(results);
            contentType = 'text/csv';
            fileExtension = 'csv';
        } else {
            content = JSON.stringify(results, null, 2);
            contentType = 'application/json';
            fileExtension = 'json';
        }

        const finalFilename = filename || defaultFilename;

        return new NextResponse(content, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${finalFilename}.${fileExtension}"`,
                'Cache-Control': 'no-cache',
            },
        });
    } catch (error: any) {
        console.error('Failed to export inspection results:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to export inspection results' },
            { status: 500 }
        );
    }
}
