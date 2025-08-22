import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ErrorCode,
  McpError
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { GoogleAuth } from './auth.js';
import { SearchConsoleClient } from './searchConsoleClient.js';
import { handleError } from './utils/errors.js';
import {
  formatSearchAnalyticsResults,
  formatSitesList,
  formatSitemapsList,
  formatUrlInspection
} from './utils/formatting.js';
import {
  SiteUrlSchema,
  SearchAnalyticsSchema,
  SitemapSchema,
  UrlInspectionSchema,
  validateDateRange
} from './schemas/validation.js';

export class SearchConsoleServer {
  private server: Server;
  private auth: GoogleAuth | null = null;
  private searchConsoleClient: SearchConsoleClient | null = null;

  constructor() {
    this.server = new Server(
      {
        name: 'Google Search Console MCP',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupRequestHandlers();
  }

  private setupRequestHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return this.getToolDefinitions();
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.searchConsoleClient) {
        throw new McpError(
          ErrorCode.InternalError,
          'Search Console client not initialized. Please check your authentication setup.'
        );
      }
      return this.handleToolCall(request);
    });
  }

  private getToolDefinitions() {
    return {
      tools: [
        {
          name: 'list_sites',
          description: 'List all sites in your Google Search Console account with their permission levels',
          inputSchema: {
            type: 'object',
            properties: {},
            required: []
          }
        },
        {
          name: 'get_site',
          description: 'Get detailed information about a specific site in Search Console',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site (e.g., https://example.com/ or sc-domain:example.com)'
              }
            },
            required: ['siteUrl']
          }
        },
        {
          name: 'query_search_analytics',
          description: 'Query comprehensive search analytics data including clicks, impressions, CTR, and average position',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format (max 16 months ago)'
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format'
              },
              dimensions: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['query', 'page', 'country', 'device', 'searchAppearance', 'date']
                },
                description: 'Dimensions to group results by'
              },
              metrics: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['clicks', 'impressions', 'ctr', 'position']
                },
                description: 'Metrics to include in the results'
              },
              rowLimit: {
                type: 'number',
                description: 'Maximum number of rows to return (default: 1000, max: 25000)'
              },
              startRow: {
                type: 'number',
                description: 'Starting row for pagination (default: 0)'
              }
            },
            required: ['siteUrl', 'startDate', 'endDate']
          }
        },
        {
          name: 'list_sitemaps',
          description: 'List all sitemaps submitted for a site with their status',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              }
            },
            required: ['siteUrl']
          }
        },
        {
          name: 'get_sitemap',
          description: 'Get detailed information about a specific sitemap',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              feedpath: {
                type: 'string',
                description: 'The path to the sitemap'
              }
            },
            required: ['siteUrl', 'feedpath']
          }
        },
        {
          name: 'submit_sitemap',
          description: 'Submit a new sitemap to Google Search Console',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              feedpath: {
                type: 'string',
                description: 'The URL of the sitemap to submit'
              }
            },
            required: ['siteUrl', 'feedpath']
          }
        },
        {
          name: 'delete_sitemap',
          description: 'Delete a sitemap from Google Search Console',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              feedpath: {
                type: 'string',
                description: 'The path to the sitemap to delete'
              }
            },
            required: ['siteUrl', 'feedpath']
          }
        },
        {
          name: 'inspect_url',
          description: 'Inspect a URL to see how Google sees it, including index status, mobile usability, and rich results',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              inspectionUrl: {
                type: 'string',
                description: 'The URL to inspect'
              }
            },
            required: ['siteUrl', 'inspectionUrl']
          }
        },
        {
          name: 'add_site',
          description: 'Add a new site to your Google Search Console account',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site to add (e.g., https://example.com/ or sc-domain:example.com)'
              }
            },
            required: ['siteUrl']
          }
        },
        {
          name: 'delete_site',
          description: 'Remove a site from your Google Search Console account',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site to remove'
              }
            },
            required: ['siteUrl']
          }
        },
        {
          name: 'batch_inspect_urls',
          description: 'Inspect multiple URLs at once and get their index status',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              urls: {
                type: 'array',
                items: {
                  type: 'string'
                },
                description: 'Array of URLs to inspect'
              }
            },
            required: ['siteUrl', 'urls']
          }
        },
        {
          name: 'check_sitemap_index_status',
          description: 'Check the index status summary for a sitemap',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              sitemapUrl: {
                type: 'string',
                description: 'The URL of the sitemap'
              }
            },
            required: ['siteUrl', 'sitemapUrl']
          }
        },
        {
          name: 'find_non_indexed_urls',
          description: 'Automatically find non-indexed URLs and their reasons by combining multiple tools (sitemaps, search analytics, and URL inspection)',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              useSitemaps: {
                type: 'boolean',
                description: 'Use sitemaps to find URLs (default: true)'
              },
              sampleSize: {
                type: 'number',
                description: 'Maximum number of URLs to check (default: 50)'
              },
              checkReasons: {
                type: 'boolean',
                description: 'Analyze reasons for non-indexing (default: true)'
              }
            },
            required: ['siteUrl']
          }
        },
        {
          name: 'query_search_analytics_advanced',
          description: 'Advanced search analytics with complex filters, search types, and data states',
          inputSchema: {
            type: 'object',
            properties: {
              siteUrl: {
                type: 'string',
                description: 'The URL of the site'
              },
              startDate: {
                type: 'string',
                description: 'Start date in YYYY-MM-DD format'
              },
              endDate: {
                type: 'string',
                description: 'End date in YYYY-MM-DD format'
              },
              dimensions: {
                type: 'array',
                items: {
                  type: 'string',
                  enum: ['query', 'page', 'country', 'device', 'searchAppearance', 'date']
                },
                description: 'Dimensions to group results by'
              },
              searchType: {
                type: 'string',
                enum: ['web', 'image', 'video', 'news'],
                description: 'Type of search results to filter'
              },
              dataState: {
                type: 'string',
                enum: ['final', 'all'],
                description: 'Include final data only or all data'
              },
              filters: {
                type: 'array',
                description: 'Complex filter conditions',
                items: {
                  type: 'object',
                  properties: {
                    groupType: {
                      type: 'string',
                      enum: ['and', 'or']
                    },
                    conditions: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          dimension: {
                            type: 'string'
                          },
                          operator: {
                            type: 'string',
                            enum: ['equals', 'contains', 'notContains', 'notEquals']
                          },
                          expression: {
                            type: 'string'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            required: ['siteUrl', 'startDate', 'endDate']
          }
        }
      ]
    };
  }

  private async handleToolCall(request: any) {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'list_sites': {
          const sites = await this.searchConsoleClient!.listSites();
          return {
            content: [
              {
                type: 'text',
                text: formatSitesList(sites)
              }
            ]
          };
        }

        case 'get_site': {
          const validated = SiteUrlSchema.parse(args);
          const site = await this.searchConsoleClient!.getSite(validated.siteUrl);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(site, null, 2)
              }
            ]
          };
        }

        case 'query_search_analytics': {
          const validated = SearchAnalyticsSchema.parse(args);
          validateDateRange(validated.startDate, validated.endDate);
          
          const data = await this.searchConsoleClient!.querySearchAnalytics(validated);
          return {
            content: [
              {
                type: 'text',
                text: formatSearchAnalyticsResults(data)
              }
            ]
          };
        }

        case 'list_sitemaps': {
          const validated = SiteUrlSchema.parse(args);
          const sitemaps = await this.searchConsoleClient!.listSitemaps(validated.siteUrl);
          return {
            content: [
              {
                type: 'text',
                text: formatSitemapsList(sitemaps)
              }
            ]
          };
        }

        case 'get_sitemap': {
          const validated = SitemapSchema.parse(args);
          const sitemap = await this.searchConsoleClient!.getSitemap(
            validated.siteUrl,
            validated.feedpath
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(sitemap, null, 2)
              }
            ]
          };
        }

        case 'submit_sitemap': {
          const validated = SitemapSchema.parse(args);
          await this.searchConsoleClient!.submitSitemap(
            validated.siteUrl,
            validated.feedpath
          );
          return {
            content: [
              {
                type: 'text',
                text: `✅ Sitemap submitted successfully: ${validated.feedpath}`
              }
            ]
          };
        }

        case 'delete_sitemap': {
          const validated = SitemapSchema.parse(args);
          await this.searchConsoleClient!.deleteSitemap(
            validated.siteUrl,
            validated.feedpath
          );
          return {
            content: [
              {
                type: 'text',
                text: `✅ Sitemap deleted successfully: ${validated.feedpath}`
              }
            ]
          };
        }

        case 'inspect_url': {
          const validated = UrlInspectionSchema.parse(args);
          const inspection = await this.searchConsoleClient!.inspectUrl(
            validated.siteUrl,
            validated.inspectionUrl
          );
          return {
            content: [
              {
                type: 'text',
                text: formatUrlInspection(inspection)
              }
            ]
          };
        }

        case 'add_site': {
          const validated = SiteUrlSchema.parse(args);
          await this.searchConsoleClient!.addSite(validated.siteUrl);
          return {
            content: [
              {
                type: 'text',
                text: `✅ Site added successfully: ${validated.siteUrl}`
              }
            ]
          };
        }

        case 'delete_site': {
          const validated = SiteUrlSchema.parse(args);
          await this.searchConsoleClient!.deleteSite(validated.siteUrl);
          return {
            content: [
              {
                type: 'text',
                text: `✅ Site removed successfully: ${validated.siteUrl}`
              }
            ]
          };
        }

        case 'batch_inspect_urls': {
          if (!args || !args.siteUrl || !args.urls || !Array.isArray(args.urls)) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'siteUrl and urls array are required'
            );
          }
          const results = await this.searchConsoleClient!.batchInspectUrls(
            args.siteUrl,
            args.urls
          );
          return {
            content: [
              {
                type: 'text',
                text: this.formatBatchInspectionResults(results)
              }
            ]
          };
        }

        case 'check_sitemap_index_status': {
          if (!args || !args.siteUrl || !args.sitemapUrl) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'siteUrl and sitemapUrl are required'
            );
          }
          const status = await this.searchConsoleClient!.checkSitemapIndexStatus(
            args.siteUrl,
            args.sitemapUrl
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(status, null, 2)
              }
            ]
          };
        }

        case 'find_non_indexed_urls': {
          const validated = SiteUrlSchema.parse(args);
          const results = await this.searchConsoleClient!.findNonIndexedUrls(
            validated.siteUrl,
            {
              useSitemaps: args.useSitemaps,
              sampleSize: args.sampleSize,
              checkReasons: args.checkReasons
            }
          );
          return {
            content: [
              {
                type: 'text',
                text: this.formatNonIndexedResults(results)
              }
            ]
          };
        }

        case 'query_search_analytics_advanced': {
          if (!args || !args.siteUrl || !args.startDate || !args.endDate) {
            throw new McpError(
              ErrorCode.InvalidParams,
              'siteUrl, startDate, and endDate are required'
            );
          }
          validateDateRange(args.startDate, args.endDate);
          const data = await this.searchConsoleClient!.querySearchAnalyticsAdvanced(args);
          return {
            content: [
              {
                type: 'text',
                text: formatSearchAnalyticsResults(data)
              }
            ]
          };
        }

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

  private formatNonIndexedResults(results: any): string {
    let output = `📊 **Non-Indexed URLs Analysis Report**\n\n`;
    output += `🔍 Site: ${results.siteUrl}\n`;
    output += `📅 Timestamp: ${results.timestamp}\n\n`;

    // Summary section
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

    // Non-indexed reasons breakdown
    if (results.summary.nonIndexedReasons) {
      output += `## 🔍 Non-Indexed Reasons Breakdown\n\n`;
      const reasons = Object.entries(results.summary.nonIndexedReasons)
        .sort((a, b) => (b[1] as number) - (a[1] as number));
      
      for (const [reason, count] of reasons) {
        output += `- **${reason}**: ${count} URL(s)\n`;
      }
      output += '\n';
    }

    // Detailed non-indexed URLs
    if (results.nonIndexedUrls.length > 0) {
      output += `## ⚠️ Non-Indexed URLs (${results.nonIndexedUrls.length})\n\n`;
      
      // Group by reason
      const byReason: Record<string, any[]> = {};
      for (const url of results.nonIndexedUrls) {
        const reason = url.reason || 'Unknown';
        if (!byReason[reason]) byReason[reason] = [];
        byReason[reason].push(url);
      }
      
      // Display grouped URLs
      for (const [reason, urls] of Object.entries(byReason)) {
        output += `### ${reason} (${urls.length})\n\n`;
        for (const url of urls.slice(0, 5)) { // Show first 5 of each category
          output += `- **${url.url}**\n`;
          if (url.coverageState && url.coverageState !== 'UNKNOWN') {
            output += `  - Coverage: ${url.coverageState}\n`;
          }
          if (url.indexingState && url.indexingState !== 'UNKNOWN') {
            output += `  - Indexing: ${url.indexingState}\n`;
          }
          if (url.lastCrawlTime) {
            output += `  - Last Crawled: ${new Date(url.lastCrawlTime).toLocaleDateString()}\n`;
          }
        }
        if (urls.length > 5) {
          output += `  ... and ${urls.length - 5} more\n`;
        }
        output += '\n';
      }
    }

    // Errors section
    if (results.errors.length > 0) {
      output += `## ❌ Errors (${results.errors.length})\n\n`;
      for (const error of results.errors.slice(0, 5)) {
        output += `- ${error.url}: ${error.error}\n`;
      }
      if (results.errors.length > 5) {
        output += `... and ${results.errors.length - 5} more errors\n`;
      }
      output += '\n';
    }

    // Recommendations
    output += `## 💡 Recommendations\n\n`;
    if (results.summary.nonIndexedReasons) {
      const topReason = Object.entries(results.summary.nonIndexedReasons)
        .sort((a, b) => (b[1] as number) - (a[1] as number))[0];
      
      if (topReason) {
        const [reason, count] = topReason;
        output += `1. **Focus on "${reason}"**: This affects ${count} URLs\n`;
        
        // Specific recommendations based on reason
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

  private formatBatchInspectionResults(results: any[]): string {
    let output = `🔍 **Batch URL Inspection Results**\n\n`;
    output += `Total URLs inspected: ${results.length}\n\n`;

    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error');

    output += `✅ Successful: ${successful.length}\n`;
    output += `❌ Failed: ${failed.length}\n\n`;

    // Group by index status
    const indexed = successful.filter(r => 
      r.data?.inspectionResult?.indexStatusResult?.indexingState === 'INDEXED'
    );
    const notIndexed = successful.filter(r => 
      r.data?.inspectionResult?.indexStatusResult?.indexingState !== 'INDEXED'
    );

    output += `📇 **Index Status Summary**\n`;
    output += `- Indexed: ${indexed.length}\n`;
    output += `- Not Indexed: ${notIndexed.length}\n\n`;

    // Show details for non-indexed URLs
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

    // Show errors
    if (failed.length > 0) {
      output += `\n❌ **Failed Inspections**\n`;
      for (const result of failed) {
        output += `- ${result.url}: ${result.error}\n`;
      }
    }

    return output;
  }

  private async initialize(): Promise<void> {
    try {
      console.error('Initializing Google Authentication...');
      this.auth = new GoogleAuth();
      await this.auth.initialize();
      
      console.error('Creating Search Console client...');
      this.searchConsoleClient = new SearchConsoleClient(this.auth);
      
      console.error('Initialization complete');
    } catch (error) {
      console.error('Failed to initialize:', error);
      throw error;
    }
  }

  async run(): Promise<void> {
    try {
      await this.initialize();
      const transport = new StdioServerTransport();
      await this.server.connect(transport);
      console.error('Google Search Console MCP server is running');
    } catch (error) {
      console.error('Fatal server error:', error);
      process.exit(1);
    }
  }
}