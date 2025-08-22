export const CONSTANTS = {
  SERVER: {
    NAME: 'Google Search Console MCP',
    VERSION: '1.0.0',
  },
  
  API: {
    SCOPES: [
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/webmasters'
    ],
    RATE_LIMIT_DELAY: 100,
    MAX_PAST_MONTHS: 16,
  },
  
  LIMITS: {
    DEFAULT_ROW_LIMIT: 1000,
    MAX_ROW_LIMIT: 25000,
    DEFAULT_SAMPLE_SIZE: 50,
    DISPLAY_LIMIT: 50,
    URL_BATCH_PREVIEW: 5,
  },
  
  STATUS: {
    SUCCESS: 'success',
    ERROR: 'error',
    INDEXED: 'INDEXED',
    UNKNOWN: 'UNKNOWN',
  },
  
  MESSAGES: {
    SUCCESS: {
      SITEMAP_SUBMIT: 'Sitemap submitted successfully',
      SITEMAP_DELETE: 'Sitemap deleted successfully',
      SITE_ADD: 'Site added successfully',
      SITE_DELETE: 'Site removed successfully',
    },
    ERROR: {
      CLIENT_NOT_INITIALIZED: 'Search Console client not initialized. Please check your authentication setup.',
      AUTH_NOT_INITIALIZED: 'Authentication not initialized',
      TOKEN_NOT_FOUND: 'Token file not found. Please run authentication flow first.',
      PERMISSION_DENIED: 'Permission denied. Make sure you have the necessary permissions for this Search Console property.',
      RESOURCE_NOT_FOUND: 'Resource not found. Please check the URL or resource identifier.',
      INVALID_PARAMS: 'Invalid request parameters.',
      UNKNOWN_ERROR: 'An unknown error occurred',
      UNEXPECTED_ERROR: 'An unexpected error occurred',
    },
    INFO: {
      NO_DATA: 'No search analytics data found for the specified period.',
      NO_SITES: 'No sites found in your Search Console account.',
      NO_SITEMAPS: 'No sitemaps found for this site.',
      NO_INSPECTION_DATA: 'No inspection data available for this URL.',
    }
  },
  
  DATE_FORMAT: {
    REGEX: /^\d{4}-\d{2}-\d{2}$/,
  }
} as const;