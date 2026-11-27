import { invokeFunction } from './invoke';
import type { ClevelandSearchResponse, ClevelandArtwork } from '@/types/api';

interface ClevelandSearchParams {
  query: string;
  skip?: number;
  limit?: number;
  hasImage?: boolean;
  type?: string;
  department?: string;
  culture?: string;
  created_after?: number;
  created_before?: number;
}

export async function searchCleveland(params: ClevelandSearchParams): Promise<ClevelandSearchResponse> {
  return invokeFunction('cleveland-museum', { action: 'search', ...params }, 'Cleveland Museum');
}

export async function getClevelandArtwork(artworkId: string): Promise<ClevelandArtwork> {
  const data = await invokeFunction<{ data: ClevelandArtwork }>('cleveland-museum', { action: 'object', artworkId }, 'Cleveland Museum');
  return data.data;
}
