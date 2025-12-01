import { NextRequest, NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function POST(req: NextRequest) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'Sitemap URL is required' }, { status: 400 });
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; SeomindBot/1.0; +http://seomind.ai)',
            },
        });

        if (!response.ok) {
            return NextResponse.json({ error: `Failed to fetch sitemap: ${response.statusText}` }, { status: 400 });
        }

        const xmlData = await response.text();
        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_"
        });
        const jsonObj = parser.parse(xmlData);

        let urls: string[] = [];

        // Handle standard sitemap (urlset)
        if (jsonObj.urlset && jsonObj.urlset.url) {
            const urlList = Array.isArray(jsonObj.urlset.url) ? jsonObj.urlset.url : [jsonObj.urlset.url];
            urls = urlList.map((u: any) => u.loc).filter(Boolean);
        }
        // Handle sitemap index (sitemapindex) - recursive fetch could be added here, but for now just return the index URLs or error
        else if (jsonObj.sitemapindex && jsonObj.sitemapindex.sitemap) {
            // For MVP, we might just want to return the sub-sitemaps or try to fetch the first level.
            // Let's just return the sub-sitemaps and let the frontend decide, OR flatten them.
            // For simplicity in this iteration, let's just return the sub-sitemaps as "pages" to analyze, 
            // BUT ideally we should fetch them. Let's try to fetch the first 5 sub-sitemaps to get actual pages.

            const sitemapList = Array.isArray(jsonObj.sitemapindex.sitemap) ? jsonObj.sitemapindex.sitemap : [jsonObj.sitemapindex.sitemap];
            const subSitemapUrls = sitemapList.map((s: any) => s.loc).filter(Boolean);

            // Limit to first 3 to avoid timeouts
            for (const subUrl of subSitemapUrls.slice(0, 3)) {
                try {
                    const subRes = await fetch(subUrl);
                    if (subRes.ok) {
                        const subXml = await subRes.text();
                        const subJson = parser.parse(subXml);
                        if (subJson.urlset && subJson.urlset.url) {
                            const subUrlList = Array.isArray(subJson.urlset.url) ? subJson.urlset.url : [subJson.urlset.url];
                            urls.push(...subUrlList.map((u: any) => u.loc));
                        }
                    }
                } catch (e) {
                    console.error(`Failed to fetch sub-sitemap ${subUrl}`, e);
                }
            }
        }

        // Deduplicate
        urls = [...new Set(urls)];

        // Limit to 50 URLs for performance
        const limitedUrls = urls.slice(0, 50);

        return NextResponse.json({
            urls: limitedUrls,
            totalFound: urls.length,
            message: urls.length > 50 ? 'Limited to first 50 URLs for performance' : 'All URLs fetched'
        });

    } catch (error: any) {
        console.error('Sitemap fetch failed:', error);
        return NextResponse.json({ error: error.message || 'Failed to parse sitemap' }, { status: 500 });
    }
}
