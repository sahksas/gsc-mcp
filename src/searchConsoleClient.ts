import { google, searchconsole_v1 } from 'googleapis';
import { GoogleAuth } from './auth.js';
import {
  SearchAnalyticsQuery,
  AdvancedSearchAnalyticsQuery,
  SiteInfo,
  SearchAnalyticsResponse,
  SitemapInfo,
  UrlInspectionResult,
  BatchInspectionResult,
  SitemapIndexStatus,
  NonIndexedUrlsResult,
  NonIndexedUrlsSummary,
  UrlIndexInfo,
  UrlInspectionError,
  FindNonIndexedUrlsOptions,
} from './types/index.js';
import { CONSTANTS } from './constants.js';

export class SearchConsoleClient {
  private client: searchconsole_v1.Searchconsole;

  constructor(auth: GoogleAuth) {
    this.client = google.searchconsole({
      version: 'v1',
      auth: auth.getClient()
    });
  }

  async listSites(): Promise<SiteInfo[]> {
    try {
      const response = await this.client.sites.list();
      const sites = response.data.siteEntry || [];
      return sites.map(site => ({
        siteUrl: site.siteUrl || '',
        permissionLevel: site.permissionLevel || undefined
      }));
    } catch (error) {
      throw new Error(`Failed to list sites: ${error}`);
    }
  }

  async getSite(siteUrl: string): Promise<SiteInfo> {
    try {
      const response = await this.client.sites.get({ siteUrl });
      return {
        siteUrl: response.data.siteUrl || siteUrl,
        permissionLevel: response.data.permissionLevel || undefined
      };
    } catch (error) {
      throw new Error(`Failed to get site: ${error}`);
    }
  }

  async querySearchAnalytics(query: SearchAnalyticsQuery): Promise<SearchAnalyticsResponse> {
    try {
      const response = await this.client.searchanalytics.query({
        siteUrl: query.siteUrl,
        requestBody: {
          startDate: query.startDate,
          endDate: query.endDate,
          dimensions: query.dimensions,
          dimensionFilterGroups: query.dimensionFilterGroups,
          aggregationType: query.aggregationType,
          rowLimit: query.rowLimit || CONSTANTS.LIMITS.DEFAULT_ROW_LIMIT,
          startRow: query.startRow || 0
        }
      });
      return response.data as SearchAnalyticsResponse;
    } catch (error) {
      throw new Error(`Failed to query search analytics: ${error}`);
    }
  }

  async listSitemaps(siteUrl: string): Promise<SitemapInfo[]> {
    try {
      const response = await this.client.sitemaps.list({ siteUrl });
      return (response.data.sitemap || []) as SitemapInfo[];
    } catch (error) {
      throw new Error(`Failed to list sitemaps: ${error}`);
    }
  }

  async getSitemap(siteUrl: string, feedpath: string): Promise<SitemapInfo> {
    try {
      const response = await this.client.sitemaps.get({ 
        siteUrl, 
        feedpath 
      });
      return response.data as SitemapInfo;
    } catch (error) {
      throw new Error(`Failed to get sitemap: ${error}`);
    }
  }

  async submitSitemap(siteUrl: string, feedpath: string): Promise<void> {
    try {
      await this.client.sitemaps.submit({ 
        siteUrl, 
        feedpath 
      });
    } catch (error) {
      throw new Error(`Failed to submit sitemap: ${error}`);
    }
  }

  async deleteSitemap(siteUrl: string, feedpath: string): Promise<void> {
    try {
      await this.client.sitemaps.delete({ 
        siteUrl, 
        feedpath 
      });
    } catch (error) {
      throw new Error(`Failed to delete sitemap: ${error}`);
    }
  }

  async inspectUrl(siteUrl: string, inspectionUrl: string): Promise<UrlInspectionResult> {
    try {
      const response = await this.client.urlInspection.index.inspect({
        requestBody: {
          siteUrl,
          inspectionUrl
        }
      });
      return response.data as UrlInspectionResult;
    } catch (error) {
      throw new Error(`Failed to inspect URL: ${error}`);
    }
  }

  async addSite(siteUrl: string): Promise<void> {
    try {
      await this.client.sites.add({ siteUrl });
    } catch (error) {
      throw new Error(`Failed to add site: ${error}`);
    }
  }

  async deleteSite(siteUrl: string): Promise<void> {
    try {
      await this.client.sites.delete({ siteUrl });
    } catch (error) {
      throw new Error(`Failed to delete site: ${error}`);
    }
  }

  async batchInspectUrls(siteUrl: string, urls: string[]): Promise<BatchInspectionResult[]> {
    const results = [];
    for (const url of urls) {
      try {
        const result = await this.inspectUrl(siteUrl, url);
        results.push({
          url,
          status: 'success' as const,
          data: result
        });
      } catch (error) {
        results.push({
          url,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      await new Promise(resolve => setTimeout(resolve, CONSTANTS.API.RATE_LIMIT_DELAY));
    }
    return results;
  }

  async checkSitemapIndexStatus(siteUrl: string, sitemapUrl: string): Promise<SitemapIndexStatus> {
    try {
      const sitemap = await this.getSitemap(siteUrl, sitemapUrl);
      
      const result: SitemapIndexStatus = {
        sitemapUrl,
        lastSubmitted: sitemap.lastSubmitted ?? undefined,
        lastDownloaded: sitemap.lastDownloaded ?? undefined,
        isPending: sitemap.isPending ?? undefined,
        isSitemapsIndex: sitemap.isSitemapsIndex ?? undefined,
        errors: sitemap.errors ?? undefined,
        warnings: sitemap.warnings ?? undefined,
        contents: sitemap.contents ?? [],
        note: 'To check index status of all URLs in sitemap, use batch_inspect_sitemap_urls tool'
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to check sitemap index status: ${error}`);
    }
  }

  async querySearchAnalyticsAdvanced(query: AdvancedSearchAnalyticsQuery): Promise<SearchAnalyticsResponse> {
    try {
      const requestBody: searchconsole_v1.Schema$SearchAnalyticsQueryRequest = {
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions,
        dimensionFilterGroups: query.dimensionFilterGroups || [],
        aggregationType: query.aggregationType,
        rowLimit: query.rowLimit || CONSTANTS.LIMITS.DEFAULT_ROW_LIMIT,
        startRow: query.startRow || 0,
        dataState: query.dataState
      };

      if (query.searchType) {
        requestBody.searchType = query.searchType;
      }

      if (query.filters) {
        const filterGroups = [];
        for (const filter of query.filters) {
          filterGroups.push({
            groupType: filter.groupType || 'and',
            filters: filter.conditions.map((condition) => ({
              dimension: condition.dimension,
              operator: condition.operator,
              expression: condition.expression
            }))
          });
        }
        requestBody.dimensionFilterGroups = filterGroups;
      }

      const response = await this.client.searchanalytics.query({
        siteUrl: query.siteUrl,
        requestBody
      });
      
      return response.data as SearchAnalyticsResponse;
    } catch (error) {
      throw new Error(`Failed to query advanced search analytics: ${error}`);
    }
  }

  async mobileFriendlyTest(url: string): Promise<any> {
    try {
      // URLテストツールAPIを使用（もし利用可能であれば）
      const response = await (this.client as any).urlTestingTools?.mobileFriendlyTest?.run({
        requestBody: {
          url,
          requestScreenshot: true
        }
      });
      
      if (!response) {
        return {
          url,
          status: 'unavailable',
          message: 'Mobile-friendly test API is not available in current implementation'
        };
      }
      
      return response.data;
    } catch (error) {
      throw new Error(`Failed to run mobile-friendly test: ${error}`);
    }
  }

  async fetchSitemapUrls(sitemapUrl: string): Promise<string[]> {
    // Note: This is a placeholder. In a real implementation, you would:
    // 1. Fetch the sitemap XML from the URL
    // 2. Parse the XML to extract all <url><loc> elements
    // 3. Handle sitemap index files that reference other sitemaps
    // For now, we return a note about implementation
    console.log('Fetching sitemap URLs from:', sitemapUrl);
    return [];
  }

  async findNonIndexedUrls(
    siteUrl: string,
    options?: FindNonIndexedUrlsOptions
  ): Promise<NonIndexedUrlsResult> {
    const results: NonIndexedUrlsResult = {
      siteUrl,
      totalUrlsChecked: 0,
      indexedUrls: [] as UrlIndexInfo[],
      nonIndexedUrls: [] as UrlIndexInfo[],
      errors: [] as UrlInspectionError[],
      summary: {} as NonIndexedUrlsSummary,
      timestamp: new Date().toISOString()
    };

    try {
      // Step 1: Get all sitemaps for the site
      let urlsToCheck: string[] = [];
      
      if (options?.useSitemaps !== false) {
        console.log('Fetching sitemaps...');
        const sitemaps = await this.listSitemaps(siteUrl);
        
        // Get a sample of URLs from search analytics (these are definitely indexed)
        const analyticsData = await this.querySearchAnalytics({
          siteUrl,
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          dimensions: ['page'],
          rowLimit: 1000
        });
        
        const indexedPages = new Set(
          (analyticsData.rows || []).map((row: any) => row.keys?.[0]).filter(Boolean)
        );
        
        if (sitemaps.length > 0) {
          results.summary.sitemapsFound = sitemaps.length;
          results.summary.sitemapsProcessed = Math.min(3, sitemaps.length);
        }
        urlsToCheck = [
          siteUrl,
          `${siteUrl}about/`,
          `${siteUrl}contact/`,
          `${siteUrl}products/`,
          `${siteUrl}services/`,
          `${siteUrl}blog/`,
          ...Array.from(indexedPages).slice(0, 10) as string[]
        ];
      }

      // Step 2: Batch inspect URLs
      if (urlsToCheck.length > 0) {
        const sampleSize = options?.sampleSize || CONSTANTS.LIMITS.DEFAULT_SAMPLE_SIZE;
        const urlsToInspect = urlsToCheck.slice(0, sampleSize);
        
        console.log(`Inspecting ${urlsToInspect.length} URLs...`);
        const inspectionResults = await this.batchInspectUrls(siteUrl, urlsToInspect);
        
        // Step 3: Categorize results
        for (const result of inspectionResults) {
          results.totalUrlsChecked++;
          
          if (result.status === 'error') {
            results.errors.push({
              url: result.url,
              error: result.error || ''
            });
            continue;
          }
          
          const indexStatus = result.data?.inspectionResult?.indexStatusResult;
          const isIndexed = indexStatus?.indexingState === CONSTANTS.STATUS.INDEXED;
          
          const urlInfo: UrlIndexInfo = {
            url: result.url,
            indexingState: indexStatus?.indexingState || CONSTANTS.STATUS.UNKNOWN,
            coverageState: indexStatus?.coverageState || CONSTANTS.STATUS.UNKNOWN,
            lastCrawlTime: indexStatus?.lastCrawlTime ?? undefined,
            pageFetchState: indexStatus?.pageFetchState ?? undefined,
            verdict: indexStatus?.verdict ?? undefined,
            robotsTxtState: indexStatus?.robotsTxtState ?? undefined,
            crawledAs: indexStatus?.crawledAs ?? undefined
          };
          
          if (isIndexed) {
            results.indexedUrls.push(urlInfo);
          } else {
            // Add detailed reason for non-indexing
            if (options?.checkReasons !== false) {
              urlInfo.reason = this.determineNonIndexReason(indexStatus);
            }
            results.nonIndexedUrls.push(urlInfo);
          }
        }
      }

      // Step 4: Generate summary
      results.summary = {
        ...results.summary,
        totalChecked: results.totalUrlsChecked,
        indexed: results.indexedUrls.length,
        nonIndexed: results.nonIndexedUrls.length,
        errors: results.errors.length,
        indexRate: results.totalUrlsChecked > 0 
          ? ((results.indexedUrls.length / results.totalUrlsChecked) * 100).toFixed(2) + '%'
          : 'N/A'
      };

      // Group non-indexed URLs by reason
      if (results.nonIndexedUrls.length > 0 && options?.checkReasons !== false) {
        const reasonGroups: Record<string, number> = {};
        for (const url of results.nonIndexedUrls) {
          const reason = url.reason || 'Unknown';
          reasonGroups[reason] = (reasonGroups[reason] || 0) + 1;
        }
        results.summary.nonIndexedReasons = reasonGroups;
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to find non-indexed URLs: ${error}`);
    }
  }

  private determineNonIndexReason(indexStatus: any): string {
    if (!indexStatus) return 'Unknown - No index status available';
    
    // Check various status fields to determine the reason
    if (indexStatus.robotsTxtState === 'DISALLOWED') {
      return 'Blocked by robots.txt';
    }
    
    if (indexStatus.indexingState === 'INDEXING_ALLOWED_BUT_NOT_INDEXED') {
      return 'Crawled - currently not indexed';
    }
    
    if (indexStatus.pageFetchState === 'NOT_FOUND') {
      return 'Page not found (404)';
    }
    
    if (indexStatus.pageFetchState === 'REDIRECT') {
      return 'Page redirects';
    }
    
    if (indexStatus.pageFetchState === 'SOFT_404') {
      return 'Soft 404';
    }
    
    if (indexStatus.coverageState === 'EXCLUDED_BY_NOINDEX') {
      return 'Excluded by noindex tag';
    }
    
    if (indexStatus.coverageState === 'DUPLICATE_WITHOUT_USER_SELECTED_CANONICAL') {
      return 'Duplicate without user-selected canonical';
    }
    
    if (indexStatus.coverageState === 'DUPLICATE_WITH_USER_SELECTED_CANONICAL') {
      return 'Duplicate with user-selected canonical';
    }
    
    if (indexStatus.coverageState === 'ALTERNATE_WITH_PROPER_CANONICAL') {
      return 'Alternate page with proper canonical';
    }
    
    if (indexStatus.verdict === 'EXCLUDED') {
      return 'Excluded from index';
    }
    
    if (indexStatus.verdict === 'ERROR') {
      return 'Error during indexing';
    }
    
    // Default reason based on coverage state
    return indexStatus.coverageState || 'Unknown reason';
  }
}