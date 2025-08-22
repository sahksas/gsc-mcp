import { z } from 'zod';

// Date validation helper
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const SiteUrlSchema = z.object({
  siteUrl: z.string().min(1, 'Site URL is required')
});

export const SearchAnalyticsSchema = z.object({
  siteUrl: z.string().min(1, 'Site URL is required'),
  startDate: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(dateRegex, 'Date must be in YYYY-MM-DD format'),
  dimensions: z.array(
    z.enum(['query', 'page', 'country', 'device', 'searchAppearance', 'date'])
  ).optional(),
  metrics: z.array(
    z.enum(['clicks', 'impressions', 'ctr', 'position'])
  ).optional(),
  rowLimit: z.number().min(1).max(25000).optional().default(1000),
  startRow: z.number().min(0).optional().default(0),
  aggregationType: z.enum(['auto', 'byPage', 'byProperty']).optional()
});

export const SitemapSchema = z.object({
  siteUrl: z.string().min(1, 'Site URL is required'),
  feedpath: z.string().min(1, 'Sitemap path is required')
});

export const UrlInspectionSchema = z.object({
  siteUrl: z.string().min(1, 'Site URL is required'),
  inspectionUrl: z.string().url('Inspection URL must be a valid URL')
});

// Validate dates are not in the future and within valid range
export function validateDateRange(startDate: string, endDate: string): void {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  
  if (start > end) {
    throw new Error('Start date must be before or equal to end date');
  }
  
  if (end > today) {
    throw new Error('End date cannot be in the future');
  }
  
  // Search Console API limitation: max 16 months of data
  const maxPastDate = new Date();
  maxPastDate.setMonth(maxPastDate.getMonth() - 16);
  
  if (start < maxPastDate) {
    throw new Error('Start date cannot be more than 16 months in the past');
  }
}