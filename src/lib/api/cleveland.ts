import { supabase } from '@/lib/supabase';
import type { ClevelandSearchResponse, ClevelandArtwork } from '@/types/api';

interface ClevelandSearchParams {
  query: string;
  skip?: number;
  limit?: number;
  hasImage?: boolean;
  type?: string;
  department?: string;
  created_after?: number;
  created_before?: number;
}

export async function searchCleveland(params: ClevelandSearchParams): Promise<ClevelandSearchResponse> {
  const { data, error } = await supabase.functions.invoke('cleveland-museum', {
    body: { action: 'search', ...params },
  });

  if (error) throw new Error(`Cleveland search failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Cleveland search failed');
  return data.data;
}

export async function getClevelandArtwork(artworkId: string): Promise<ClevelandArtwork> {
  const { data, error } = await supabase.functions.invoke('cleveland-museum', {
    body: { action: 'object', artworkId },
  });

  if (error) throw new Error(`Cleveland fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Cleveland fetch failed');
  return data.data.data;
}
