import { getSupabase } from '@/lib/supabase';

interface SmithsonianSearchParams {
  query: string;
  rows?: number;
  start?: number;
  online_media_only?: boolean;
}

interface SmithsonianSearchResponse {
  rowCount: number;
  rows: Array<{
    id: string;
    title: string;
    unitCode: string;
    content?: {
      descriptiveNonRepeating?: {
        title?: { content?: string };
        metadata_usage?: { access?: string };
        online_media?: {
          media?: Array<{
            thumbnail?: string;
            idsId?: string;
            type?: string;
          }>;
        };
      };
      freetext?: {
        date?: Array<{ content?: string }>;
        objectType?: Array<{ content?: string }>;
        physicalDescription?: Array<{ content?: string }>;
        dataSource?: Array<{ content?: string }>;
      };
      indexedStructured?: {
        date?: string[];
        object_type?: string[];
        place?: string[];
        topic?: string[];
      };
    };
  }>;
}

export async function searchSmithsonian(params: SmithsonianSearchParams): Promise<SmithsonianSearchResponse> {
  const { data, error } = await getSupabase().functions.invoke('smithsonian', {
    body: {
      action: 'search',
      query: params.query,
      rows: params.rows || 20,
      start: params.start || 0,
      online_media_only: params.online_media_only,
    },
  });

  if (error) throw new Error(`Smithsonian search failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Smithsonian search failed');
  return data.data;
}

export async function getSmithsonianItem(itemId: string) {
  const { data, error } = await getSupabase().functions.invoke('smithsonian', {
    body: { action: 'item', itemId },
  });

  if (error) throw new Error(`Smithsonian fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Smithsonian fetch failed');
  return data.data;
}
