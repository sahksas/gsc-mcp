import { google, searchconsole_v1 } from 'googleapis';
import { GoogleAuth } from './auth.js';

export interface SearchAnalyticsQuery {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: string[];
  dimensionFilterGroups?: any[];
  aggregationType?: string;
  rowLimit?: number;
  startRow?: number;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel?: string;
}

export class SearchConsoleClient {
  private client: searchconsole_v1.Searchconsole;
  private auth: GoogleAuth;

  constructor(auth: GoogleAuth) {
    this.auth = auth;
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

  async querySearchAnalytics(query: SearchAnalyticsQuery): Promise<any> {
    try {
      const response = await this.client.searchanalytics.query({
        siteUrl: query.siteUrl,
        requestBody: {
          startDate: query.startDate,
          endDate: query.endDate,
          dimensions: query.dimensions,
          dimensionFilterGroups: query.dimensionFilterGroups,
          aggregationType: query.aggregationType,
          rowLimit: query.rowLimit || 1000,
          startRow: query.startRow || 0
        }
      } as any);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to query search analytics: ${error}`);
    }
  }

  async listSitemaps(siteUrl: string): Promise<any[]> {
    try {
      const response = await this.client.sitemaps.list({ siteUrl });
      return response.data.sitemap || [];
    } catch (error) {
      throw new Error(`Failed to list sitemaps: ${error}`);
    }
  }

  async getSitemap(siteUrl: string, feedpath: string): Promise<any> {
    try {
      const response = await this.client.sitemaps.get({ 
        siteUrl, 
        feedpath 
      });
      return response.data;
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

  async inspectUrl(siteUrl: string, inspectionUrl: string): Promise<any> {
    try {
      const response = await this.client.urlInspection.index.inspect({
        requestBody: {
          siteUrl,
          inspectionUrl
        }
      });
      return response.data;
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

  async batchInspectUrls(siteUrl: string, urls: string[]): Promise<any[]> {
    const results = [];
    for (const url of urls) {
      try {
        const result = await this.inspectUrl(siteUrl, url);
        results.push({
          url,
          status: 'success',
          data: result
        });
      } catch (error) {
        results.push({
          url,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      // APIレート制限を考慮して少し待機
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return results;
  }

  async checkSitemapIndexStatus(siteUrl: string, sitemapUrl: string): Promise<any> {
    try {
      // サイトマップの情報を取得
      const sitemap = await this.getSitemap(siteUrl, sitemapUrl);
      
      // サイトマップからURLリストを取得（実際にはAPI経由では直接取得できないため、
      // ここでは概要情報のみ返す。実装では外部でサイトマップをフェッチして処理）
      const result = {
        sitemapUrl,
        lastSubmitted: sitemap.lastSubmitted,
        lastDownloaded: sitemap.lastDownloaded,
        isPending: sitemap.isPending,
        isSitemapsIndex: sitemap.isSitemapsIndex,
        errors: sitemap.errors,
        warnings: sitemap.warnings,
        contents: sitemap.contents || [],
        note: 'To check index status of all URLs in sitemap, use batch_inspect_sitemap_urls tool'
      };
      
      return result;
    } catch (error) {
      throw new Error(`Failed to check sitemap index status: ${error}`);
    }
  }

  async querySearchAnalyticsAdvanced(query: any): Promise<any> {
    try {
      // 高度なフィルタリング機能を追加
      const requestBody: any = {
        startDate: query.startDate,
        endDate: query.endDate,
        dimensions: query.dimensions,
        dimensionFilterGroups: query.dimensionFilterGroups || [],
        aggregationType: query.aggregationType,
        rowLimit: query.rowLimit || 1000,
        startRow: query.startRow || 0,
        dataState: query.dataState // 'final' or 'all'
      };

      // 検索タイプフィルター
      if (query.searchType) {
        requestBody.searchType = query.searchType; // 'web', 'image', 'video', 'news'
      }

      // 複雑なフィルター条件の構築
      if (query.filters) {
        const filterGroups = [];
        for (const filter of query.filters) {
          filterGroups.push({
            groupType: filter.groupType || 'and',
            filters: filter.conditions.map((condition: any) => ({
              dimension: condition.dimension,
              operator: condition.operator, // 'equals', 'contains', 'notContains', 'notEquals'
              expression: condition.expression
            }))
          });
        }
        requestBody.dimensionFilterGroups = filterGroups;
      }

      const response = await this.client.searchanalytics.query({
        siteUrl: query.siteUrl,
        requestBody
      } as any);
      
      return response.data;
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

  async findNonIndexedUrls(siteUrl: string, options?: {
    useSitemaps?: boolean;
    sampleSize?: number;
    checkReasons?: boolean;
  }): Promise<any> {
    const results = {
      siteUrl,
      totalUrlsChecked: 0,
      indexedUrls: [] as any[],
      nonIndexedUrls: [] as any[],
      errors: [] as any[],
      summary: {} as any,
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
        
        // For demonstration, we'll create a sample URL list
        // In production, you'd fetch and parse actual sitemap XML
        if (sitemaps.length > 0) {
          // Extract sample URLs based on sitemap paths
          const sampleUrls: string[] = [];
          for (const sitemap of sitemaps.slice(0, 3)) {
            // This is where you'd actually fetch and parse the sitemap
            // For now, we'll note that the sitemap should be processed
            results.summary.sitemapsFound = sitemaps.length;
            results.summary.sitemapsProcessed = Math.min(3, sitemaps.length);
          }
        }

        // Create a list of URLs to check (for demo, use base variations)
        const baseUrl = new URL(siteUrl);
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
        const sampleSize = options?.sampleSize || 50;
        const urlsToInspect = urlsToCheck.slice(0, sampleSize);
        
        console.log(`Inspecting ${urlsToInspect.length} URLs...`);
        const inspectionResults = await this.batchInspectUrls(siteUrl, urlsToInspect);
        
        // Step 3: Categorize results
        for (const result of inspectionResults) {
          results.totalUrlsChecked++;
          
          if (result.status === 'error') {
            results.errors.push({
              url: result.url,
              error: result.error
            });
            continue;
          }
          
          const indexStatus = result.data?.inspectionResult?.indexStatusResult;
          const isIndexed = indexStatus?.indexingState === 'INDEXED';
          
          const urlInfo: any = {
            url: result.url,
            indexingState: indexStatus?.indexingState || 'UNKNOWN',
            coverageState: indexStatus?.coverageState || 'UNKNOWN',
            lastCrawlTime: indexStatus?.lastCrawlTime,
            pageFetchState: indexStatus?.pageFetchState,
            verdict: indexStatus?.verdict,
            robotsTxtState: indexStatus?.robotsTxtState,
            crawledAs: indexStatus?.crawledAs
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