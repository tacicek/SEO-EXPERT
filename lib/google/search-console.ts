import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { XMLParser } from 'fast-xml-parser';
import type {
    UrlInspectionResponse,
    SimplifiedInspectionResult,
    InspectionSummary,
} from '@/lib/types/gsc';

export class GoogleSearchConsoleService {
    private auth: OAuth2Client;
    private searchConsole;

    constructor(accessToken: string, refreshToken?: string) {
        this.auth = new google.auth.OAuth2();
        this.auth.setCredentials({
            access_token: accessToken,
            refresh_token: refreshToken,
        });

        this.searchConsole = google.searchconsole({
            version: 'v1',
            auth: this.auth,
        });
    }

    async listSites() {
        try {
            const res = await this.searchConsole.sites.list();
            return res.data.siteEntry || [];
        } catch (error) {
            console.error('Error listing sites:', error);
            throw error;
        }
    }

    async listSitemaps(siteUrl: string) {
        try {
            const res = await this.searchConsole.sitemaps.list({
                siteUrl,
            });
            return res.data.sitemap || [];
        } catch (error) {
            console.error('Error listing sitemaps:', error);
            throw error;
        }
    }

    async inspectUrl(
        siteUrl: string,
        inspectionUrl: string,
        languageCode: string = 'en-US'
    ): Promise<UrlInspectionResponse> {
        try {
            const res = await this.searchConsole.urlInspection.index.inspect({
                requestBody: {
                    siteUrl,
                    inspectionUrl,
                    languageCode,
                },
            });
            return res.data as UrlInspectionResponse;
        } catch (error) {
            console.error('Error inspecting URL:', error);
            throw error;
        }
    }

    async getSearchAnalytics(
        siteUrl: string,
        startDate: string,
        endDate: string,
        dimensions: string[] = ['query', 'page'],
        rowLimit: number = 1000,
        dimensionFilterGroups?: Array<{
            filters: Array<{
                dimension: string;
                expression: string;
                operator: 'contains' | 'equals' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';
            }>;
        }>
    ) {
        try {
            const requestBody: any = {
                startDate,
                endDate,
                dimensions,
                rowLimit,
                dataState: 'final',
            };

            if (dimensionFilterGroups && dimensionFilterGroups.length > 0) {
                requestBody.dimensionFilterGroups = dimensionFilterGroups;
            }

            const res = await this.searchConsole.searchanalytics.query({
                siteUrl,
                requestBody,
            });
            return res.data.rows || [];
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
    }

    /**
     * Fetch all analytics data with pagination (supports 25k+ rows)
     * Uses pagination to fetch more than 25,000 rows
     */
    async getSearchAnalyticsAll(
        siteUrl: string,
        startDate: string,
        endDate: string,
        dimensions: string[] = ['query', 'page'],
        dimensionFilterGroups?: Array<{
            filters: Array<{
                dimension: string;
                expression: string;
                operator: 'contains' | 'equals' | 'notContains' | 'notEquals' | 'includingRegex' | 'excludingRegex';
            }>;
        }>,
        onProgress?: (fetched: number) => void
    ): Promise<any[]> {
        const allRows: any[] = [];
        let startRow = 0;
        const rowLimit = 25000;

        try {
            while (true) {
                const requestBody: any = {
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit,
                    startRow,
                    dataState: 'final',
                };

                if (dimensionFilterGroups && dimensionFilterGroups.length > 0) {
                    requestBody.dimensionFilterGroups = dimensionFilterGroups;
                }

                const res = await this.searchConsole.searchanalytics.query({
                    siteUrl,
                    requestBody,
                });

                const rows = res.data.rows || [];
                allRows.push(...rows);

                if (onProgress) {
                    onProgress(allRows.length);
                }

                // If we got less than the limit, we've fetched all data
                if (rows.length < rowLimit) {
                    break;
                }

                startRow += rows.length;

                // Add small delay to avoid rate limiting
                await this.delay(100);
            }

            return allRows;
        } catch (error) {
            console.error('Error fetching all analytics:', error);
            throw error;
        }
    }

    /**
     * Get analytics grouped by date for trend analysis
     */
    async getDateTrends(
        siteUrl: string,
        startDate: string,
        endDate: string,
        country?: string
    ): Promise<{
        date: string;
        clicks: number;
        impressions: number;
        ctr: number;
        position: number;
    }[]> {
        const dimensionFilterGroups = country
            ? [{ filters: [{ dimension: 'COUNTRY', expression: country, operator: 'equals' as const }] }]
            : undefined;

        const rows = await this.getSearchAnalytics(
            siteUrl,
            startDate,
            endDate,
            ['DATE'],
            25000,
            dimensionFilterGroups
        );

        return rows.map((row: any) => ({
            date: row.keys[0],
            clicks: row.clicks,
            impressions: row.impressions,
            ctr: row.ctr,
            position: row.position,
        }));
    }

    /**
     * Analyze branded vs non-branded query performance
     */
    async getBrandedAnalysis(
        siteUrl: string,
        startDate: string,
        endDate: string,
        brandTerms: string[]
    ): Promise<{
        branded: { clicks: number; impressions: number; ctr: number; position: number; queryCount: number };
        nonBranded: { clicks: number; impressions: number; ctr: number; position: number; queryCount: number };
        trend: Array<{
            date: string;
            branded: { clicks: number; impressions: number };
            nonBranded: { clicks: number; impressions: number };
        }>;
    }> {
        // Fetch all queries with date dimension
        const rows = await this.getSearchAnalyticsAll(
            siteUrl,
            startDate,
            endDate,
            ['DATE', 'QUERY']
        );

        const branded = { clicks: 0, impressions: 0, ctr: 0, position: 0, queryCount: 0 };
        const nonBranded = { clicks: 0, impressions: 0, ctr: 0, position: 0, queryCount: 0 };
        const trendMap: Map<string, { branded: { clicks: number; impressions: number }; nonBranded: { clicks: number; impressions: number } }> = new Map();

        for (const row of rows) {
            const date = row.keys[0];
            const query = row.keys[1].toLowerCase();
            const isBranded = brandTerms.some(term => query.includes(term.toLowerCase()));

            if (!trendMap.has(date)) {
                trendMap.set(date, {
                    branded: { clicks: 0, impressions: 0 },
                    nonBranded: { clicks: 0, impressions: 0 },
                });
            }

            const dayData = trendMap.get(date)!;

            if (isBranded) {
                branded.clicks += row.clicks;
                branded.impressions += row.impressions;
                branded.position += row.position;
                branded.queryCount++;
                dayData.branded.clicks += row.clicks;
                dayData.branded.impressions += row.impressions;
            } else {
                nonBranded.clicks += row.clicks;
                nonBranded.impressions += row.impressions;
                nonBranded.position += row.position;
                nonBranded.queryCount++;
                dayData.nonBranded.clicks += row.clicks;
                dayData.nonBranded.impressions += row.impressions;
            }
        }

        // Calculate averages
        if (branded.queryCount > 0) {
            branded.ctr = branded.clicks / branded.impressions;
            branded.position = branded.position / branded.queryCount;
        }
        if (nonBranded.queryCount > 0) {
            nonBranded.ctr = nonBranded.clicks / nonBranded.impressions;
            nonBranded.position = nonBranded.position / nonBranded.queryCount;
        }

        // Convert trend map to array and sort by date
        const trend = Array.from(trendMap.entries())
            .map(([date, data]) => ({ date, ...data }))
            .sort((a, b) => a.date.localeCompare(b.date));

        return { branded, nonBranded, trend };
    }

    /**
     * Calculate CTR curve by position
     */
    async getCTRCurve(
        siteUrl: string,
        startDate: string,
        endDate: string,
        brandTerms?: string[]
    ): Promise<{
        overall: Array<{ position: number; ctr: number; clicks: number; impressions: number }>;
        branded?: Array<{ position: number; ctr: number; clicks: number; impressions: number }>;
        nonBranded?: Array<{ position: number; ctr: number; clicks: number; impressions: number }>;
    }> {
        const rows = await this.getSearchAnalyticsAll(
            siteUrl,
            startDate,
            endDate,
            ['QUERY']
        );

        // Group by rounded position
        const positionData: Map<number, { clicks: number; impressions: number }> = new Map();
        const brandedData: Map<number, { clicks: number; impressions: number }> = new Map();
        const nonBrandedData: Map<number, { clicks: number; impressions: number }> = new Map();

        for (const row of rows) {
            const roundedPosition = Math.round(row.position);
            if (roundedPosition < 1 || roundedPosition > 100) continue;

            // Overall
            if (!positionData.has(roundedPosition)) {
                positionData.set(roundedPosition, { clicks: 0, impressions: 0 });
            }
            const posData = positionData.get(roundedPosition)!;
            posData.clicks += row.clicks;
            posData.impressions += row.impressions;

            // Branded/Non-branded if brand terms provided
            if (brandTerms && brandTerms.length > 0) {
                const query = row.keys[0].toLowerCase();
                const isBranded = brandTerms.some(term => query.includes(term.toLowerCase()));
                const targetMap = isBranded ? brandedData : nonBrandedData;

                if (!targetMap.has(roundedPosition)) {
                    targetMap.set(roundedPosition, { clicks: 0, impressions: 0 });
                }
                const data = targetMap.get(roundedPosition)!;
                data.clicks += row.clicks;
                data.impressions += row.impressions;
            }
        }

        // Convert to array and calculate CTR
        const convertToArray = (map: Map<number, { clicks: number; impressions: number }>) =>
            Array.from(map.entries())
                .filter(([pos]) => pos <= 20) // Focus on top 20 positions
                .map(([position, data]) => ({
                    position,
                    clicks: data.clicks,
                    impressions: data.impressions,
                    ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
                }))
                .sort((a, b) => a.position - b.position);

        const result: any = {
            overall: convertToArray(positionData),
        };

        if (brandTerms && brandTerms.length > 0) {
            result.branded = convertToArray(brandedData);
            result.nonBranded = convertToArray(nonBrandedData);
        }

        return result;
    }

    /**
     * Get unique query and page counts over time
     */
    async getUniqueCounts(
        siteUrl: string,
        startDate: string,
        endDate: string,
        country?: string
    ): Promise<{
        queryTrend: Array<{ date: string; count: number; clicks: number; impressions: number }>;
        pageTrend: Array<{ date: string; count: number; clicks: number; impressions: number }>;
        topQueriesRanking: Array<{ date: string; top10Count: number; top3Count: number }>;
    }> {
        const dimensionFilterGroups = country
            ? [{ filters: [{ dimension: 'COUNTRY', expression: country, operator: 'equals' as const }] }]
            : undefined;

        // Fetch date + query data
        const queryRows = await this.getSearchAnalyticsAll(
            siteUrl,
            startDate,
            endDate,
            ['DATE', 'QUERY'],
            dimensionFilterGroups
        );

        // Fetch date + page data
        const pageRows = await this.getSearchAnalyticsAll(
            siteUrl,
            startDate,
            endDate,
            ['DATE', 'PAGE'],
            dimensionFilterGroups
        );

        // Process query data
        const queryByDate = new Map<string, { queries: Set<string>; clicks: number; impressions: number; top10: number; top3: number }>();
        for (const row of queryRows) {
            const date = row.keys[0];
            if (!queryByDate.has(date)) {
                queryByDate.set(date, { queries: new Set(), clicks: 0, impressions: 0, top10: 0, top3: 0 });
            }
            const data = queryByDate.get(date)!;
            data.queries.add(row.keys[1]);
            data.clicks += row.clicks;
            data.impressions += row.impressions;
            if (row.position <= 10) data.top10++;
            if (row.position <= 3) data.top3++;
        }

        // Process page data
        const pageByDate = new Map<string, { pages: Set<string>; clicks: number; impressions: number }>();
        for (const row of pageRows) {
            const date = row.keys[0];
            if (!pageByDate.has(date)) {
                pageByDate.set(date, { pages: new Set(), clicks: 0, impressions: 0 });
            }
            const data = pageByDate.get(date)!;
            data.pages.add(row.keys[1]);
            data.clicks += row.clicks;
            data.impressions += row.impressions;
        }

        return {
            queryTrend: Array.from(queryByDate.entries())
                .map(([date, data]) => ({
                    date,
                    count: data.queries.size,
                    clicks: data.clicks,
                    impressions: data.impressions,
                }))
                .sort((a, b) => a.date.localeCompare(b.date)),
            pageTrend: Array.from(pageByDate.entries())
                .map(([date, data]) => ({
                    date,
                    count: data.pages.size,
                    clicks: data.clicks,
                    impressions: data.impressions,
                }))
                .sort((a, b) => a.date.localeCompare(b.date)),
            topQueriesRanking: Array.from(queryByDate.entries())
                .map(([date, data]) => ({
                    date,
                    top10Count: data.top10,
                    top3Count: data.top3,
                }))
                .sort((a, b) => a.date.localeCompare(b.date)),
        };
    }

    /**
     * Export analytics data to CSV
     */
    exportAnalyticsToCSV(rows: any[], dimensions: string[]): string {
        const headers = [...dimensions, 'clicks', 'impressions', 'ctr', 'position'];

        const csvRows = rows.map((row) => {
            const values = [
                ...row.keys,
                row.clicks,
                row.impressions,
                (row.ctr * 100).toFixed(2) + '%',
                row.position.toFixed(1),
            ];
            return values.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
        });

        return [headers.join(','), ...csvRows].join('\n');
    }

    /**
     * Fetch and parse URLs from a sitemap
     * Supports both regular sitemaps and sitemap indexes
     */
    async fetchSitemapUrls(sitemapUrl: string, limit?: number): Promise<string[]> {
        try {
            const response = await fetch(sitemapUrl, {
                headers: {
                    'User-Agent': 'SEOMind/1.0 (Google Search Console Integration)',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch sitemap: ${response.statusText}`);
            }

            const xml = await response.text();
            const parser = new XMLParser({
                ignoreAttributes: false,
                attributeNamePrefix: '@_',
            });
            const parsed = parser.parse(xml);

            let urls: string[] = [];

            // Handle sitemap index (contains links to other sitemaps)
            if (parsed.sitemapindex) {
                const sitemaps = Array.isArray(parsed.sitemapindex.sitemap)
                    ? parsed.sitemapindex.sitemap
                    : [parsed.sitemapindex.sitemap];

                // Recursively fetch URLs from each sitemap
                for (const sitemap of sitemaps) {
                    if (limit && urls.length >= limit) break;
                    const subUrls = await this.fetchSitemapUrls(sitemap.loc, limit ? limit - urls.length : undefined);
                    urls.push(...subUrls);
                }
            }
            // Handle regular sitemap (contains actual URLs)
            else if (parsed.urlset) {
                const urlEntries = Array.isArray(parsed.urlset.url)
                    ? parsed.urlset.url
                    : [parsed.urlset.url];

                urls = urlEntries
                    .map((entry: any) => entry.loc)
                    .filter((loc: string) => {
                        // Filter out image URLs and other non-page URLs
                        return loc && !loc.includes('image:loc');
                    });
            }

            // Apply limit if specified
            if (limit && urls.length > limit) {
                urls = urls.slice(0, limit);
            }

            return urls;
        } catch (error) {
            console.error('Error fetching sitemap URLs:', error);
            throw error;
        }
    }

    /**
     * Batch inspect multiple URLs with rate limiting
     * GSC API limits: 600 requests/min, 2000 requests/day per site
     */
    async batchInspectUrls(
        siteUrl: string,
        urls: string[],
        languageCode: string = 'en-US',
        onProgress?: (current: number, total: number) => void
    ): Promise<SimplifiedInspectionResult[]> {
        const results: SimplifiedInspectionResult[] = [];
        const delayMs = 150; // ~400 requests/min to stay under limit

        for (let i = 0; i < urls.length; i++) {
            const url = urls[i];

            try {
                const response = await this.inspectUrl(siteUrl, url, languageCode);
                const indexStatus = response.inspectionResult?.indexStatusResult;

                results.push({
                    url,
                    verdict: indexStatus?.verdict || 'UNKNOWN',
                    coverageState: indexStatus?.coverageState || '',
                    robotsTxtState: indexStatus?.robotsTxtState || '',
                    indexingState: indexStatus?.indexingState || '',
                    lastCrawlTime: indexStatus?.lastCrawlTime,
                    pageFetchState: indexStatus?.pageFetchState || '',
                    googleCanonical: indexStatus?.googleCanonical,
                    userCanonical: indexStatus?.userCanonical,
                    sitemap: indexStatus?.sitemap,
                    referringUrls: indexStatus?.referringUrls,
                    crawledAs: indexStatus?.crawledAs,
                    inspectionLink: response.inspectionResult?.inspectionResultLink,
                });

                // Call progress callback
                if (onProgress) {
                    onProgress(i + 1, urls.length);
                }

                // Add delay between requests (except for the last one)
                if (i < urls.length - 1) {
                    await this.delay(delayMs);
                }
            } catch (error: any) {
                console.error(`Error inspecting ${url}:`, error);
                results.push({
                    url,
                    verdict: 'ERROR',
                    coverageState: '',
                    robotsTxtState: '',
                    indexingState: '',
                    pageFetchState: '',
                    error: error.message || 'Unknown error',
                });

                if (onProgress) {
                    onProgress(i + 1, urls.length);
                }
            }
        }

        return results;
    }

    /**
     * Generate inspection summary statistics
     */
    generateInspectionSummary(results: SimplifiedInspectionResult[]): InspectionSummary {
        const summary: InspectionSummary = {
            total: results.length,
            passed: 0,
            failed: 0,
            indexed: 0,
            notIndexed: 0,
            errors: 0,
        };

        for (const result of results) {
            if (result.error) {
                summary.errors++;
            } else if (result.verdict === 'PASS') {
                summary.passed++;
            } else if (result.verdict === 'FAIL') {
                summary.failed++;
            }

            if (result.coverageState?.toLowerCase().includes('indexed')) {
                summary.indexed++;
            } else if (result.coverageState) {
                summary.notIndexed++;
            }
        }

        return summary;
    }

    /**
     * Convert inspection results to CSV format
     */
    exportToCSV(results: SimplifiedInspectionResult[]): string {
        const headers = [
            'URL',
            'Verdict',
            'Coverage State',
            'Robots.txt State',
            'Indexing State',
            'Last Crawl Time',
            'Page Fetch State',
            'Google Canonical',
            'User Canonical',
            'Crawled As',
            'Sitemap',
            'Referring URLs',
            'Inspection Link',
            'Error',
        ];

        const rows = results.map((r) => [
            r.url,
            r.verdict,
            r.coverageState,
            r.robotsTxtState,
            r.indexingState,
            r.lastCrawlTime || '',
            r.pageFetchState,
            r.googleCanonical || '',
            r.userCanonical || '',
            r.crawledAs || '',
            (r.sitemap || []).join('; '),
            (r.referringUrls || []).join('; '),
            r.inspectionLink || '',
            r.error || '',
        ]);

        const csvContent = [headers, ...rows]
            .map((row) =>
                row
                    .map((cell) => {
                        // Escape quotes and wrap in quotes
                        const escaped = String(cell).replace(/"/g, '""');
                        return `"${escaped}"`;
                    })
                    .join(',')
            )
            .join('\n');

        return csvContent;
    }

    /**
     * Helper method to add delay between requests
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

