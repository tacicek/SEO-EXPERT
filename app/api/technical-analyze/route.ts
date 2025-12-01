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

        // Helper to add issue
        const addIssue = (type: 'error' | 'warning' | 'info', message: string, impact: 'high' | 'medium' | 'low', explanation: string, fix: string) => {
            issues.push({ type, message, impact, explanation, fix });
            if (type === 'error') score -= 10;
            if (type === 'warning') score -= 5;
        };

        // --- Meta Analysis ---
        const title = $('title').text().trim();
        const description = $('meta[name="description"]').attr('content')?.trim() || '';
        const canonical = $('link[rel="canonical"]').attr('href');
        const robots = $('meta[name="robots"]').attr('content');
        const viewport = $('meta[name="viewport"]').attr('content');
        const lang = $('html').attr('lang');
        const charset = $('meta[charset]').attr('charset') || $('meta[http-equiv="Content-Type"]').attr('content');

        if (!title) {
            addIssue('error', 'Missing title tag', 'high',
                'The title tag is the most important on-page SEO element. It tells search engines and users what your page is about.',
                'Add a <title> tag to the <head> section of your HTML.'
            );
        } else if (title.length < 30 || title.length > 60) {
            addIssue('warning', `Title length (${title.length}) is not optimal`, 'medium',
                'Titles should be between 30-60 characters to display fully in search results without truncation.',
                'Rewrite your title to be concise yet descriptive, keeping it within the recommended length.'
            );
        }

        if (!description) {
            addIssue('error', 'Missing meta description', 'high',
                'Meta descriptions provide a summary of your page content in search results and influence click-through rates (CTR).',
                'Add a <meta name="description"> tag with a compelling summary of your page.'
            );
        } else if (description.length < 120 || description.length > 160) {
            addIssue('warning', `Description length (${description.length}) is not optimal`, 'medium',
                'Descriptions should be between 120-160 characters to maximize visibility in SERPs.',
                'Edit your meta description to fit within the recommended character limit.'
            );
        }

        if (!viewport) {
            addIssue('warning', 'Missing viewport meta tag', 'medium',
                'The viewport tag controls how your site is displayed on mobile devices. Without it, mobile users may see a desktop version.',
                'Add <meta name="viewport" content="width=device-width, initial-scale=1"> to your <head>.'
            );
        }

        if (!lang) {
            addIssue('info', 'Missing HTML language attribute', 'low',
                'The lang attribute helps search engines and screen readers understand the language of your content.',
                'Add the lang attribute to your html tag, e.g., <html lang="en">.'
            );
        }

        // --- Headings Analysis ---
        const h1Count = $('h1').length;
        if (h1Count === 0) {
            addIssue('error', 'Missing H1 tag', 'high',
                'The H1 tag acts as the main headline of the page. It helps search engines understand the primary topic.',
                'Add a single <h1> tag containing the main topic of your page.'
            );
        } else if (h1Count > 1) {
            addIssue('warning', 'Multiple H1 tags found', 'medium',
                'Having multiple H1 tags can confuse search engines about the main topic of the page. Use H2-H6 for subheadings.',
                'Ensure there is only one <h1> tag per page. Change other headings to <h2>, <h3>, etc.'
            );
        }

        // --- Content Analysis ---
        const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
        const wordCount = bodyText.split(' ').length;

        if (wordCount < 300) {
            addIssue('warning', `Low word count (${wordCount} words)`, 'medium',
                'Pages with thin content (under 300 words) may struggle to rank as they often lack depth.',
                'Expand your content to cover the topic in more detail and provide value to users.'
            );
        }

        // --- Images Analysis ---
        const images = $('img');
        let missingAlt = 0;
        images.each((_, el) => {
            if (!$(el).attr('alt')) missingAlt++;
        });

        if (missingAlt > 0) {
            addIssue('warning', `${missingAlt} images missing alt text`, 'medium',
                'Alt text describes images to search engines and screen readers. It is crucial for accessibility and Image SEO.',
                'Add descriptive alt attributes to all <img> tags.'
            );
        }

        // --- Link Analysis ---
        const links = $('a');
        let internalLinks = 0;
        let externalLinks = 0;

        links.each((_, el) => {
            const href = $(el).attr('href');
            if (href) {
                if (href.startsWith('/') || href.includes(new URL(url).hostname)) {
                    internalLinks++;
                } else if (href.startsWith('http')) {
                    externalLinks++;
                }
            }
        });

        if (internalLinks === 0) {
            addIssue('warning', 'No internal links found', 'medium',
                'Internal links help search engines discover other pages on your site and distribute link equity.',
                'Add links to other relevant pages on your website.'
            );
        }

        // --- URL Analysis ---
        if (url.includes('http://')) {
            addIssue('error', 'URL is not using HTTPS', 'high',
                'HTTPS is a ranking signal and essential for security. Browsers mark HTTP sites as "Not Secure".',
                'Install an SSL certificate and redirect all HTTP traffic to HTTPS.'
            );
        }

        // --- Schema Analysis (Basic) ---
        const schema = $('script[type="application/ld+json"]');
        if (schema.length === 0) {
            addIssue('info', 'No Schema.org structured data found', 'low',
                'Structured data helps search engines understand your content better and can lead to rich snippets in search results.',
                'Implement relevant Schema.org markup (e.g., Article, Product, Organization) using JSON-LD.'
            );
        }

        // Normalize score
        score = Math.max(0, score);

        return NextResponse.json({
            url,
            analyzed_at: new Date().toISOString(),
            score: {
                overall: score,
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
            content: {
                word_count: wordCount,
            },
            images: {
                total: images.length,
                missing_alt: missingAlt
            },
            links: {
                internal: internalLinks,
                external: externalLinks,
                total: links.length
            },
            issues: issues.sort((a, b) => {
                const impactScore = { high: 3, medium: 2, low: 1 };
                return (impactScore[b.impact as keyof typeof impactScore] || 0) - (impactScore[a.impact as keyof typeof impactScore] || 0);
            }),
        });

    } catch (error: any) {
        console.error('Technical analysis failed:', error);
        return NextResponse.json({ error: error.message || 'Analysis failed' }, { status: 500 });
    }
}
