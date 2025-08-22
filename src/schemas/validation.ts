import { z } from 'zod';
import { CONSTANTS } from '../constants.js';

export const SiteUrlSchema = z.object({
  siteUrl: z.string().min(1, 'Site URL is required')
});

export const SearchAnalyticsSchema = z.object({
  siteUrl: z.string().min(1, 'Site URL is required'),
  startDate: z.string().regex(CONSTANTS.DATE_FORMAT.REGEX, 'Date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(CONSTANTS.DATE_FORMAT.REGEX, 'Date must be in YYYY-MM-DD format'),
  dimensions: z.array(
    z.enum(['query', 'page', 'country', 'device', 'searchAppearance', 'date'])
  ).optional(),
  metrics: z.array(
    z.enum(['clicks', 'impressions', 'ctr', 'position'])
  ).optional(),
  rowLimit: z.number().min(1).max(CONSTANTS.LIMITS.MAX_ROW_LIMIT).optional().default(CONSTANTS.LIMITS.DEFAULT_ROW_LIMIT),
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
  
  const maxPastDate = new Date();
  maxPastDate.setMonth(maxPastDate.getMonth() - CONSTANTS.API.MAX_PAST_MONTHS);
  
  if (start < maxPastDate) {
    throw new Error('Start date cannot be more than 16 months in the past');
  }
}