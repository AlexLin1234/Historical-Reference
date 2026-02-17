import { getSupabase } from '@/lib/supabase';

interface ChicagoSearchParams {
  query: string;
  limit?: number;
  page?: number;
}

export interface ChicagoArtwork {
  id: number;
  title: string;
  artist_display: string | null;
  date_display: string | null;
  date_start: number | null;
  date_end: number | null;
  medium_display: string | null;
  dimensions: string | null;
  image_id: string | null;
  classification_title: string | null;
  department_title: string | null;
  place_of_origin: string | null;
  credit_line: string | null;
  thumbnail: { alt_text: string; width: number; height: number } | null;
  description: string | null;
  is_public_domain: boolean;
  api_link: string;
}

export interface ChicagoSearchResponse {
  pagination: {
    total: number;
    limit: number;
    offset: number;
    total_pages: number;
    current_page: number;
  };
  data: ChicagoArtwork[];
  config: {
    iiif_url: string;
  };
}

export async function searchChicago(params: ChicagoSearchParams): Promise<ChicagoSearchResponse> {
  const { data, error } = await getSupabase().functions.invoke('chicago-museum', {
    body: {
      action: 'search',
      query: params.query,
      limit: params.limit || 20,
      page: params.page || 1,
    },
  });

  if (error) throw new Error(`Chicago search failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Chicago search failed');
  return data.data;
}

export async function getChicagoArtwork(artworkId: number): Promise<{ data: ChicagoArtwork; config: { iiif_url: string } }> {
  const { data, error } = await getSupabase().functions.invoke('chicago-museum', {
    body: { action: 'object', artworkId },
  });

  if (error) throw new Error(`Chicago fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Chicago fetch failed');
  return data.data;
}
