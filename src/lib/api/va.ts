import { supabase } from '@/lib/supabase';
import type { VASearchResponse, VAObjectResponse } from '@/types/api';

interface VASearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  category?: string;
}

export async function searchVA(params: VASearchParams): Promise<VASearchResponse> {
  const { data, error } = await supabase.functions.invoke('va-museum', {
    body: { action: 'search', ...params },
  });

  if (error) throw new Error(`V&A search failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'V&A search failed');
  return data.data;
}

export async function getVAObject(systemNumber: string): Promise<VAObjectResponse> {
  const { data, error } = await supabase.functions.invoke('va-museum', {
    body: { action: 'object', systemNumber },
  });

  if (error) throw new Error(`V&A fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'V&A fetch failed');
  return data.data;
}
