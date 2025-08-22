import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { SearchConsoleClient } from '../searchConsoleClient.js';
import {
  formatSearchAnalyticsResults,
  formatSitesList,
  formatSitemapsList,
  formatUrlInspection
} from '../utils/formatting.js';
import {
  SiteUrlSchema,
  SearchAnalyticsSchema,
  SitemapSchema,
  UrlInspectionSchema,
  validateDateRange
} from '../schemas/validation.js';
import { handleError } from '../utils/errors.js';
import { CONSTANTS } from '../constants.js';
import {
  BatchInspectionResult,
  NonIndexedUrlsResult,
} from '../types/index.js';

interface ToolResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
  [key: string]: any;
}

export class ToolHandlers {
  constructor(private client: SearchConsoleClient) {}

  async listSites(): Promise<ToolResponse> {
    const sites = await this.client.listSites();
    return {
      content: [{
        type: 'text',
        text: formatSitesList(sites)
      }]
    };
  }

  async getSite(args: any): Promise<ToolResponse> {
    const validated = SiteUrlSchema.parse(args);
    const site = await this.client.getSite(validated.siteUrl);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(site, null, 2)
      }]
    };
  }

  async querySearchAnalytics(args: any): Promise<ToolResponse> {
    const validated = SearchAnalyticsSchema.parse(args);
    validateDateRange(validated.startDate, validated.endDate);
    
    const data = await this.client.querySearchAnalytics(validated);
    return {
      content: [{
        type: 'text',
        text: formatSearchAnalyticsResults(data)
      }]
    };
  }

  async querySearchAnalyticsAdvanced(args: any): Promise<ToolResponse> {
    if (!args || !args.siteUrl || !args.startDate || !args.endDate) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'siteUrl, startDate, and endDate are required'
      );
    }
    validateDateRange(args.startDate, args.endDate);
    const data = await this.client.querySearchAnalyticsAdvanced(args);
    return {
      content: [{
        type: 'text',
        text: formatSearchAnalyticsResults(data)
      }]
    };
  }

  async listSitemaps(args: any): Promise<ToolResponse> {
    const validated = SiteUrlSchema.parse(args);
    const sitemaps = await this.client.listSitemaps(validated.siteUrl);
    return {
      content: [{
        type: 'text',
        text: formatSitemapsList(sitemaps)
      }]
    };
  }

  async getSitemap(args: any): Promise<ToolResponse> {
    const validated = SitemapSchema.parse(args);
    const sitemap = await this.client.getSitemap(
      validated.siteUrl,
      validated.feedpath
    );
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(sitemap, null, 2)
      }]
    };
  }

  async submitSitemap(args: any): Promise<ToolResponse> {
    const validated = SitemapSchema.parse(args);
    await this.client.submitSitemap(
      validated.siteUrl,
      validated.feedpath
    );
    return {
      content: [{
        type: 'text',
        text: `✅ ${CONSTANTS.MESSAGES.SUCCESS.SITEMAP_SUBMIT}: ${validated.feedpath}`
      }]
    };
  }

  async deleteSitemap(args: any): Promise<ToolResponse> {
    const validated = SitemapSchema.parse(args);
    await this.client.deleteSitemap(
      validated.siteUrl,
      validated.feedpath
    );
    return {
      content: [{
        type: 'text',
        text: `✅ ${CONSTANTS.MESSAGES.SUCCESS.SITEMAP_DELETE}: ${validated.feedpath}`
      }]
    };
  }

  async inspectUrl(args: any): Promise<ToolResponse> {
    const validated = UrlInspectionSchema.parse(args);
    const inspection = await this.client.inspectUrl(
      validated.siteUrl,
      validated.inspectionUrl
    );
    return {
      content: [{
        type: 'text',
        text: formatUrlInspection(inspection)
      }]
    };
  }

  async addSite(args: any): Promise<ToolResponse> {
    const validated = SiteUrlSchema.parse(args);
    await this.client.addSite(validated.siteUrl);
    return {
      content: [{
        type: 'text',
        text: `✅ ${CONSTANTS.MESSAGES.SUCCESS.SITE_ADD}: ${validated.siteUrl}`
      }]
    };
  }

  async deleteSite(args: any): Promise<ToolResponse> {
    const validated = SiteUrlSchema.parse(args);
    await this.client.deleteSite(validated.siteUrl);
    return {
      content: [{
        type: 'text',
        text: `✅ ${CONSTANTS.MESSAGES.SUCCESS.SITE_DELETE}: ${validated.siteUrl}`
      }]
    };
  }

  async batchInspectUrls(args: any): Promise<ToolResponse> {
    if (!args || !args.siteUrl || !args.urls || !Array.isArray(args.urls)) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'siteUrl and urls array are required'
      );
    }
    const results = await this.client.batchInspectUrls(
      args.siteUrl,
      args.urls
    );
    return {
      content: [{
        type: 'text',
        text: this.formatBatchInspectionResults(results)
      }]
    };
  }

  async checkSitemapIndexStatus(args: any): Promise<ToolResponse> {
    if (!args || !args.siteUrl || !args.sitemapUrl) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'siteUrl and sitemapUrl are required'
      );
    }
    const status = await this.client.checkSitemapIndexStatus(
      args.siteUrl,
      args.sitemapUrl
    );
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(status, null, 2)
      }]
    };
  }

  async findNonIndexedUrls(args: any): Promise<ToolResponse> {
    const validated = SiteUrlSchema.parse(args);
    const results = await this.client.findNonIndexedUrls(
      validated.siteUrl,
      {
        useSitemaps: args.useSitemaps,
        sampleSize: args.sampleSize,
        checkReasons: args.checkReasons
      }
    );
    return {
      content: [{
        type: 'text',
        text: this.formatNonIndexedResults(results)
      }]
    };
  }

  private formatBatchInspectionResults(results: BatchInspectionResult[]): string {
    let output = `🔍 **Batch URL Inspection Results**\n\n`;
    output += `Total URLs inspected: ${results.length}\n\n`;

    const successful = results.filter(r => r.status === CONSTANTS.STATUS.SUCCESS);
    const failed = results.filter(r => r.status === CONSTANTS.STATUS.ERROR);

    output += `✅ Successful: ${successful.length}\n`;
    output += `❌ Failed: ${failed.length}\n\n`;

    const indexed = successful.filter(r => 
      r.data?.inspectionResult?.indexStatusResult?.indexingState === CONSTANTS.STATUS.INDEXED
    );
    const notIndexed = successful.filter(r => 
      r.data?.inspectionResult?.indexStatusResult?.indexingState !== CONSTANTS.STATUS.INDEXED
    );

    output += `📇 **Index Status Summary**\n`;
    output += `- Indexed: ${indexed.length}\n`;
    output += `- Not Indexed: ${notIndexed.length}\n\n`;

    if (notIndexed.length > 0) {
      output += `⚠️ **Non-Indexed URLs**\n`;
      for (const result of notIndexed) {
        const status = result.data?.inspectionResult?.indexStatusResult;
        output += `\n**${result.url}**\n`;
        output += `  - Coverage State: ${status?.coverageState || 'Unknown'}\n`;
        output += `  - Indexing State: ${status?.indexingState || 'Unknown'}\n`;
        if (status?.pageFetchState) {
          output += `  - Fetch State: ${status.pageFetchState}\n`;
        }
        if (status?.verdict) {
          output += `  - Verdict: ${status.verdict}\n`;
        }
      }
    }

    if (failed.length > 0) {
      output += `\n❌ **Failed Inspections**\n`;
      for (const result of failed) {
        output += `- ${result.url}: ${result.error}\n`;
      }
    }

    return output;
  }

  private formatNonIndexedResults(results: NonIndexedUrlsResult): string {
    let output = `📊 **Non-Indexed URLs Analysis Report**\n\n`;
    output += `🔍 Site: ${results.siteUrl}\n`;
    output += `📅 Timestamp: ${results.timestamp}\n\n`;

    output += `## 📈 Summary\n\n`;
    output += `- **Total URLs Checked**: ${results.summary.totalChecked}\n`;
    output += `- **Indexed**: ${results.summary.indexed} ✅\n`;
    output += `- **Non-Indexed**: ${results.summary.nonIndexed} ⚠️\n`;
    output += `- **Errors**: ${results.summary.errors} ❌\n`;
    output += `- **Index Rate**: ${results.summary.indexRate}\n`;
    
    if (results.summary.sitemapsFound) {
      output += `- **Sitemaps Found**: ${results.summary.sitemapsFound}\n`;
      output += `- **Sitemaps Processed**: ${results.summary.sitemapsProcessed}\n`;
    }
    output += '\n';

    if (results.summary.nonIndexedReasons) {
      output += `## 🔍 Non-Indexed Reasons Breakdown\n\n`;
      const reasons = Object.entries(results.summary.nonIndexedReasons)
        .sort((a, b) => (b[1] as number) - (a[1] as number));
      
      for (const [reason, count] of reasons) {
        output += `- **${reason}**: ${count} URL(s)\n`;
      }
      output += '\n';
    }

    if (results.nonIndexedUrls.length > 0) {
      output += `## ⚠️ Non-Indexed URLs (${results.nonIndexedUrls.length})\n\n`;
      
      const byReason: Record<string, any[]> = {};
      for (const url of results.nonIndexedUrls) {
        const reason = url.reason || 'Unknown';
        if (!byReason[reason]) byReason[reason] = [];
        byReason[reason].push(url);
      }
      
      for (const [reason, urls] of Object.entries(byReason)) {
        output += `### ${reason} (${urls.length})\n\n`;
        for (const url of urls.slice(0, CONSTANTS.LIMITS.URL_BATCH_PREVIEW)) {
          output += `- **${url.url}**\n`;
          if (url.coverageState && url.coverageState !== CONSTANTS.STATUS.UNKNOWN) {
            output += `  - Coverage: ${url.coverageState}\n`;
          }
          if (url.indexingState && url.indexingState !== CONSTANTS.STATUS.UNKNOWN) {
            output += `  - Indexing: ${url.indexingState}\n`;
          }
          if (url.lastCrawlTime) {
            output += `  - Last Crawled: ${new Date(url.lastCrawlTime).toLocaleDateString()}\n`;
          }
        }
        if (urls.length > CONSTANTS.LIMITS.URL_BATCH_PREVIEW) {
          output += `  ... and ${urls.length - CONSTANTS.LIMITS.URL_BATCH_PREVIEW} more\n`;
        }
        output += '\n';
      }
    }

    if (results.errors.length > 0) {
      output += `## ❌ Errors (${results.errors.length})\n\n`;
      for (const error of results.errors.slice(0, CONSTANTS.LIMITS.URL_BATCH_PREVIEW)) {
        output += `- ${error.url}: ${error.error}\n`;
      }
      if (results.errors.length > CONSTANTS.LIMITS.URL_BATCH_PREVIEW) {
        output += `... and ${results.errors.length - CONSTANTS.LIMITS.URL_BATCH_PREVIEW} more errors\n`;
      }
      output += '\n';
    }

    output += `## 💡 Recommendations\n\n`;
    if (results.summary.nonIndexedReasons) {
      const topReason = Object.entries(results.summary.nonIndexedReasons)
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      
      if (topReason) {
        const [reason, count] = topReason;
        output += `1. **Focus on "${reason}"**: This affects ${count} URLs\n`;
        
        if (reason.includes('robots.txt')) {
          output += `   - Review your robots.txt file for unintended blocks\n`;
        } else if (reason.includes('404')) {
          output += `   - Fix broken links or implement proper redirects\n`;
        } else if (reason.includes('noindex')) {
          output += `   - Review pages with noindex tags to ensure they're intentional\n`;
        } else if (reason.includes('Duplicate')) {
          output += `   - Implement proper canonical tags to resolve duplicate content\n`;
        } else if (reason.includes('Crawled - currently not indexed')) {
          output += `   - Improve content quality and relevance for these pages\n`;
        }
      }
    }
    
    output += `2. Run this analysis regularly to track indexing improvements\n`;
    output += `3. Use URL Inspection tool for detailed analysis of specific problematic URLs\n`;

    return output;
  }

  async handleToolCall(name: string, args: any): Promise<ToolResponse> {
    try {
      switch (name) {
        case 'list_sites':
          return await this.listSites();
        case 'get_site':
          return await this.getSite(args);
        case 'query_search_analytics':
          return await this.querySearchAnalytics(args);
        case 'query_search_analytics_advanced':
          return await this.querySearchAnalyticsAdvanced(args);
        case 'list_sitemaps':
          return await this.listSitemaps(args);
        case 'get_sitemap':
          return await this.getSitemap(args);
        case 'submit_sitemap':
          return await this.submitSitemap(args);
        case 'delete_sitemap':
          return await this.deleteSitemap(args);
        case 'inspect_url':
          return await this.inspectUrl(args);
        case 'add_site':
          return await this.addSite(args);
        case 'delete_site':
          return await this.deleteSite(args);
        case 'batch_inspect_urls':
          return await this.batchInspectUrls(args);
        case 'check_sitemap_index_status':
          return await this.checkSitemapIndexStatus(args);
        case 'find_non_indexed_urls':
          return await this.findNonIndexedUrls(args);
        default:
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${name}`
          );
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new McpError(
          ErrorCode.InvalidParams,
          `Invalid parameters: ${error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')}`
        );
      }
      handleError(error, name);
    }
  }
}