
export interface SearchAnalyticsQuery {
  siteUrl: string;
  startDate: string;
  endDate: string;
  dimensions?: Array<'query' | 'page' | 'country' | 'device' | 'searchAppearance' | 'date'>;
  dimensionFilterGroups?: DimensionFilterGroup[];
  aggregationType?: 'auto' | 'byPage' | 'byProperty';
  rowLimit?: number;
  startRow?: number;
  metrics?: Array<'clicks' | 'impressions' | 'ctr' | 'position'>;
}

export interface AdvancedSearchAnalyticsQuery extends SearchAnalyticsQuery {
  searchType?: 'web' | 'image' | 'video' | 'news';
  dataState?: 'final' | 'all';
  filters?: FilterGroup[];
}

export interface FilterGroup {
  groupType?: 'and' | 'or';
  conditions: FilterCondition[];
}

export interface FilterCondition {
  dimension: string;
  operator: 'equals' | 'contains' | 'notContains' | 'notEquals';
  expression: string;
}

export interface DimensionFilterGroup {
  groupType?: 'and' | 'or';
  filters: DimensionFilter[];
}

export interface DimensionFilter {
  dimension: string;
  operator: string;
  expression: string;
}

export interface SiteInfo {
  siteUrl: string;
  permissionLevel?: string;
}

export interface SearchAnalyticsRow {
  keys?: string[] | null;
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchAnalyticsResponse {
  rows?: SearchAnalyticsRow[];
  responseAggregationType?: string;
}

export interface SitemapInfo {
  path?: string | null;
  lastSubmitted?: string | null;
  lastDownloaded?: string | null;
  isPending?: boolean | null;
  isSitemapsIndex?: boolean | null;
  errors?: number | null;
  warnings?: number | null;
  contents?: SitemapContent[] | null;
}

export interface SitemapContent {
  type?: string;
  submitted?: number;
  indexed?: number;
}

export interface UrlInspectionResult {
  inspectionResult?: {
    inspectionResultLink?: string | null;
    indexStatusResult?: IndexStatusResult | null;
    mobileUsabilityResult?: MobileUsabilityResult | null;
    richResultsResult?: RichResultsResult | null;
  } | null;
}

export interface IndexStatusResult {
  coverageState?: string | null;
  crawledAs?: string | null;
  indexingState?: string | null;
  lastCrawlTime?: string | null;
  pageFetchState?: string | null;
  verdict?: string | null;
  robotsTxtState?: string | null;
}

export interface MobileUsabilityResult {
  verdict?: string;
  issues?: MobileUsabilityIssue[];
}

export interface MobileUsabilityIssue {
  issueType?: string;
  severity?: string;
  message?: string;
}

export interface RichResultsResult {
  detectedItems?: RichResultItem[];
}

export interface RichResultItem {
  richResultType?: string;
  items?: any[];
}

export interface BatchInspectionResult {
  url: string;
  status: 'success' | 'error';
  data?: UrlInspectionResult;
  error?: string;
}

export interface SitemapIndexStatus {
  sitemapUrl: string;
  lastSubmitted?: string | null;
  lastDownloaded?: string | null;
  isPending?: boolean | null;
  isSitemapsIndex?: boolean | null;
  errors?: number | null;
  warnings?: number | null;
  contents?: SitemapContent[] | null;
  note?: string;
}

export interface NonIndexedUrlsResult {
  siteUrl: string;
  totalUrlsChecked: number;
  indexedUrls: UrlIndexInfo[];
  nonIndexedUrls: UrlIndexInfo[];
  errors: UrlInspectionError[];
  summary: NonIndexedUrlsSummary;
  timestamp: string;
}

export interface UrlIndexInfo {
  url: string;
  indexingState: string;
  coverageState: string;
  lastCrawlTime?: string | null;
  pageFetchState?: string | null;
  verdict?: string | null;
  robotsTxtState?: string | null;
  crawledAs?: string | null;
  reason?: string;
}

export interface UrlInspectionError {
  url: string;
  error: string;
}

export interface NonIndexedUrlsSummary {
  totalChecked: number;
  indexed: number;
  nonIndexed: number;
  errors: number;
  indexRate: string;
  sitemapsFound?: number;
  sitemapsProcessed?: number;
  nonIndexedReasons?: Record<string, number>;
}

export interface FindNonIndexedUrlsOptions {
  useSitemaps?: boolean;
  sampleSize?: number;
  checkReasons?: boolean;
}