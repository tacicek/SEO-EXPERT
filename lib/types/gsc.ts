/**
 * Google Search Console URL Inspection API Types
 * Based on: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 */

export interface IndexStatusResult {
    verdict: 'PASS' | 'PARTIAL' | 'FAIL' | 'NEUTRAL';
    coverageState?: string;
    robotsTxtState?: 'ALLOWED' | 'BLOCKED';
    indexingState?: 'INDEXING_ALLOWED' | 'BLOCKED_BY_META_TAG' | 'BLOCKED_BY_HTTP_HEADER' | 'BLOCKED_BY_ROBOTS_TXT';
    lastCrawlTime?: string;
    pageFetchState?: 'SUCCESSFUL' | 'SOFT_404' | 'BLOCKED_ROBOTS_TXT' | 'NOT_FOUND' | 'ACCESS_DENIED' | 'SERVER_ERROR' | 'REDIRECT_ERROR' | 'ACCESS_FORBIDDEN' | 'BLOCKED_4XX' | 'INTERNAL_CRAWL_ERROR' | 'INVALID_URL';
    googleCanonical?: string;
    userCanonical?: string;
    sitemap?: string[];
    referringUrls?: string[];
    crawledAs?: 'MOBILE' | 'DESKTOP';
}

export interface MobileUsabilityResult {
    verdict?: 'VERDICT_UNSPECIFIED' | 'PASS' | 'FAIL';
    issues?: Array<{
        issueType?: string;
        severity?: string;
        message?: string;
    }>;
}

export interface InspectionResult {
    inspectionResultLink?: string;
    indexStatusResult?: IndexStatusResult;
    mobileUsabilityResult?: MobileUsabilityResult;
}

export interface UrlInspectionResponse {
    inspectionResult: InspectionResult;
}

/**
 * Simplified inspection result for batch operations
 */
export interface SimplifiedInspectionResult {
    url: string;
    verdict: string;
    coverageState: string;
    robotsTxtState: string;
    indexingState: string;
    lastCrawlTime?: string;
    pageFetchState: string;
    googleCanonical?: string;
    userCanonical?: string;
    sitemap?: string[];
    referringUrls?: string[];
    crawledAs?: string;
    error?: string;
    inspectionLink?: string;
}

export interface InspectionSummary {
    total: number;
    passed: number;
    failed: number;
    indexed: number;
    notIndexed: number;
    errors: number;
}

export interface BatchInspectionResponse {
    results: SimplifiedInspectionResult[];
    summary: InspectionSummary;
}

/**
 * Request/Response types for API endpoints
 */
export interface InspectUrlRequest {
    siteUrl: string;
    inspectionUrl: string;
    languageCode?: string;
}

export interface FetchSitemapUrlsRequest {
    sitemapUrl: string;
    limit?: number;
}

export interface FetchSitemapUrlsResponse {
    urls: string[];
    total: number;
}

export interface BatchInspectRequest {
    siteUrl: string;
    sitemapUrl?: string;
    urls?: string[];
    languageCode?: string;
    limit?: number;
}

export interface ExportInspectionRequest {
    results: SimplifiedInspectionResult[];
    format: 'csv' | 'json';
    filename?: string;
}
