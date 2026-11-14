import { invokeFunction } from './invoke';
import type { SmithsonianItem } from '@/lib/normalizers/smithsonian';

interface SmithsonianSearchParams {
  query: string;
  rows?: number;
  start?: number;
  online_media_only?: boolean;
}

interface SmithsonianSearchResponse {
  rowCount: number;
  rows: SmithsonianItem[];
}

export async function searchSmithsonian(params: SmithsonianSearchParams): Promise<SmithsonianSearchResponse> {
  return invokeFunction('smithsonian', {
      action: 'search',
      query: params.query,
      rows: params.rows || 20,
      start: params.start || 0,
      online_media_only: params.online_media_only,
    }, 'Smithsonian');
}

export async function getSmithsonianItem(itemId: string): Promise<{ response: SmithsonianItem }> {
  return invokeFunction('smithsonian', { action: 'item', itemId }, 'Smithsonian');
}
