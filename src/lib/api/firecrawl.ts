import { getSupabase } from '@/lib/supabase';
import type { FirecrawlScrapeResponse } from '@/types/api';

export async function scrapeUrl(url: string): Promise<FirecrawlScrapeResponse> {
  const { data, error } = await getSupabase().functions.invoke('firecrawl-scrape', {
    body: { url },
  });

  if (error) throw new Error(`Scrape failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Scrape failed');
  return data.data;
}
