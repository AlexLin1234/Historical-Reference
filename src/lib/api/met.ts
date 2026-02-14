import { supabase } from '@/lib/supabase';
import type { MetSearchResponse, MetObjectResponse } from '@/types/api';

interface MetSearchParams {
  query: string;
  departmentId?: number;
  dateBegin?: number;
  dateEnd?: number;
  hasImages?: boolean;
}

export async function searchMet(params: MetSearchParams): Promise<MetSearchResponse> {
  const { data, error } = await supabase.functions.invoke('met-museum', {
    body: { action: 'search', ...params },
  });

  if (error) throw new Error(`Met search failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Met search failed');
  return data.data;
}

export async function getMetObject(objectId: number): Promise<MetObjectResponse> {
  const { data, error } = await supabase.functions.invoke('met-museum', {
    body: { action: 'object', objectId },
  });

  if (error) throw new Error(`Met fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Met fetch failed');
  return data.data;
}

export async function batchFetchMetObjects(objectIds: number[]): Promise<MetObjectResponse[]> {
  const { data, error } = await supabase.functions.invoke('met-museum', {
    body: { action: 'batch', objectIds },
  });

  if (error) throw new Error(`Met batch fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Met batch fetch failed');
  return data.data;
}
