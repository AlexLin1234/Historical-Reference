import { invokeFunction } from './invoke';
import type { FirecrawlScrapeResponse } from '@/types/api';

export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResponse> {
  return invokeFunction('firecrawl-scrape', { url }, 'Web scraping');
}
