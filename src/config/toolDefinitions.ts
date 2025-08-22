export const TOOL_DEFINITIONS = [
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
];