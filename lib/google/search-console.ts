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
        rowLimit: number = 1000
    ) {
        try {
            const res = await this.searchConsole.searchanalytics.query({
                siteUrl,
                requestBody: {
                    startDate,
                    endDate,
                    dimensions,
                    rowLimit,
                    dataState: 'final',
                },
            });
            return res.data.rows || [];
        } catch (error) {
            console.error('Error fetching analytics:', error);
            throw error;
        }
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

