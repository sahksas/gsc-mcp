export function formatSearchAnalyticsResults(data: any): string {
  if (!data.rows || data.rows.length === 0) {
    return "No search analytics data found for the specified period.";
  }

  const rows = data.rows.slice(0, 50);
  
  let result = `📊 **Search Analytics Results**\n\n`;
  result += `📈 **Summary:** ${data.rows.length} total results\n\n`;
  
  if (data.rows.length > 50) {
    result += `*Showing top 50 results*\n\n`;
  }

  rows.forEach((row: any, index: number) => {
    const keys = row.keys || [];
    const clicks = row.clicks || 0;
    const impressions = row.impressions || 0;
    const ctr = ((row.ctr || 0) * 100).toFixed(2);
    const position = (row.position || 0).toFixed(1);
    
    result += `**${index + 1}. ${keys.join(' | ')}**\n`;
    result += `   • Clicks: ${clicks.toLocaleString()}\n`;
    result += `   • Impressions: ${impressions.toLocaleString()}\n`;
    result += `   • CTR: ${ctr}%\n`;
    result += `   • Avg Position: ${position}\n\n`;
  });

  return result;
}

export function formatSitesList(sites: any[]): string {
  if (!sites || sites.length === 0) {
    return "No sites found in your Search Console account.";
  }

  let result = `🌐 **Search Console Sites**\n\n`;
  result += `Found ${sites.length} site(s):\n\n`;

  sites.forEach((site, index) => {
    result += `**${index + 1}. ${site.siteUrl}**\n`;
    if (site.permissionLevel) {
      result += `   • Permission: ${site.permissionLevel}\n`;
    }
    result += '\n';
  });

  return result;
}

export function formatSitemapsList(sitemaps: any[]): string {
  if (!sitemaps || sitemaps.length === 0) {
    return "No sitemaps found for this site.";
  }

  let result = `🗺️ **Sitemaps**\n\n`;
  result += `Found ${sitemaps.length} sitemap(s):\n\n`;

  sitemaps.forEach((sitemap, index) => {
    result += `**${index + 1}. ${sitemap.path}**\n`;
    if (sitemap.lastSubmitted) {
      result += `   • Submitted: ${new Date(sitemap.lastSubmitted).toLocaleDateString()}\n`;
    }
    if (sitemap.lastDownloaded) {
      result += `   • Last Downloaded: ${new Date(sitemap.lastDownloaded).toLocaleDateString()}\n`;
    }
    if (sitemap.errors !== undefined) {
      result += `   • Errors: ${sitemap.errors}\n`;
    }
    if (sitemap.warnings !== undefined) {
      result += `   • Warnings: ${sitemap.warnings}\n`;
    }
    result += '\n';
  });

  return result;
}

export function formatUrlInspection(inspection: any): string {
  if (!inspection || !inspection.inspectionResult) {
    return "No inspection data available for this URL.";
  }

  const result = inspection.inspectionResult;
  let output = `🔍 **URL Inspection Results**\n\n`;
  
  output += `**URL:** ${result.inspectionResultLink || 'N/A'}\n\n`;
  
  // Index status
  if (result.indexStatusResult) {
    const indexStatus = result.indexStatusResult;
    output += `**📇 Index Status**\n`;
    output += `   • Coverage State: ${indexStatus.coverageState || 'Unknown'}\n`;
    output += `   • Crawled As: ${indexStatus.crawledAs || 'Unknown'}\n`;
    output += `   • Indexing State: ${indexStatus.indexingState || 'Unknown'}\n`;
    
    if (indexStatus.lastCrawlTime) {
      output += `   • Last Crawled: ${new Date(indexStatus.lastCrawlTime).toLocaleDateString()}\n`;
    }
    output += '\n';
  }
  
  // Mobile usability
  if (result.mobileUsabilityResult) {
    const mobile = result.mobileUsabilityResult;
    output += `**📱 Mobile Usability**\n`;
    output += `   • Status: ${mobile.verdict || 'Unknown'}\n`;
    if (mobile.issues && mobile.issues.length > 0) {
      output += `   • Issues: ${mobile.issues.length} found\n`;
    }
    output += '\n';
  }
  
  // Rich results
  if (result.richResultsResult) {
    const rich = result.richResultsResult;
    output += `**✨ Rich Results**\n`;
    if (rich.detectedItems && rich.detectedItems.length > 0) {
      output += `   • Detected: ${rich.detectedItems.map((item: any) => item.richResultType).join(', ')}\n`;
    } else {
      output += `   • No rich results detected\n`;
    }
    output += '\n';
  }

  return output;
}