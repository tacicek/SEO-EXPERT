import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Fetch HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SeomindBot/1.0; +http://seomind.ai)',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch URL: ${response.statusText}` }, { status: 400 });
        }

        const html = await response.text();
        const $ = cheerio.load(html);
        const issues: any[] = [];
        let score = 100;

        // --- Meta Analysis ---
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content')?.trim() || '';
        const canonical = $('link[rel="canonical"]').attr('href');
        const robots = $('meta[name="robots"]').attr('content');
        const viewport = $('meta[name="viewport"]').attr('content');
        const lang = $('html').attr('lang');
        const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content');

        if (!title) {
            issues.push({ type: 'error', message: 'Missing title tag', impact: 'high' });
            score -= 10;
        } else if (title.length < 30 || title.length > 60) {
            issues.push({ type: 'warning', message: `Title length (${title.length}) is not optimal (30-60 chars)`, impact: 'medium' });
            score -= 5;
        }

        if (!description) {
            issues.push({ type: 'error', message: 'Missing meta description', impact: 'high' });
            score -= 10;
        } else if (description.length < 120 || description.length > 160) {
            issues.push({ type: 'warning', message: `Description length (${description.length}) is not optimal (120-160 chars)`, impact: 'medium' });
            score -= 5;
        }

        if (!viewport) {
            issues.push({ type: 'warning', message: 'Missing viewport meta tag', impact: 'medium' });
            score -= 5;
        }

        // --- Headings Analysis ---
        const h1Count = $('h1').length;
        if (h1Count === 0) {
            issues.push({ type: 'error', message: 'Missing H1 tag', impact: 'high' });
            score -= 10;
        } else if (h1Count > 1) {
            issues.push({ type: 'warning', message: 'Multiple H1 tags found', impact: 'medium' });
            score -= 5;
        }

        // --- Images Analysis ---
        const images = $('img');
        let missingAlt = 0;
        images.each((_, el) => {
            if (!$(el).attr('alt')) missingAlt++;
        });

        if (missingAlt > 0) {
            issues.push({ type: 'warning', message: `${missingAlt} images missing alt text`, impact: 'medium' });
            score -= Math.min(10, missingAlt * 2);
        }

        // --- URL Analysis ---
        if (url.includes('http://')) {
            issues.push({ type: 'error', message: 'URL is not using HTTPS', impact: 'high' });
            score -= 10;
        }

        // --- Schema Analysis (Basic) ---
        const schema = $('script[type="application/ld+json"]');
        if (schema.length === 0) {
            issues.push({ type: 'info', message: 'No Schema.org structured data found', impact: 'low' });
            score -= 5;
        }

        // Normalize score
        score = Math.max(0, score);

        return NextResponse.json({
            url,
            analyzed_at: new Date().toISOString(),
            score: {
                overall: score,
                meta: 0, // Placeholder
                headings: 0, // Placeholder
                images: 0 // Placeholder
            },
            meta: {
                title: { value: title, length: title.length },
                description: { value: description, length: description.length },
                canonical,
                robots,
                viewport,
                lang,
                charset
            },
            headings: {
                h1: h1Count,
                h2: $('h2').length,
                h3: $('h3').length
            },
            images: {
                total: images.length,
                missing_alt: missingAlt
            },
            issues: issues.sort((a, b) => {
                const impactScore = { high: 3, medium: 2, low: 1 };
                return (impactScore[b.impact as keyof typeof impactScore] || 0) - (impactScore[a.impact as keyof typeof impactScore] || 0);
            }),
            recommendations: issues.map(i => i.message) // Simple mapping for now
        });

    } catch (error: any) {
        console.error('Technical analysis failed:', error);
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
