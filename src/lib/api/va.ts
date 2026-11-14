import { invokeFunction } from './invoke';
import type { VASearchResponse, VAObjectResponse } from '@/types/api';

interface VASearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  hasImage?: boolean;
  categoryId?: string;
  yearFrom?: number;
  yearTo?: number;
}

export async function searchVA(params: VASearchParams): Promise<VASearchResponse> {
  return invokeFunction('va-museum', { action: 'search', ...params }, 'V&A');
}

export async function getVAObject(systemNumber: string): Promise<VAObjectResponse> {
  return invokeFunction('va-museum', { action: 'object', systemNumber }, 'V&A');
}
