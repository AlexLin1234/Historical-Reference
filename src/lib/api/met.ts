import { invokeFunction } from './invoke';
import type { MetSearchResponse, MetObjectResponse } from '@/types/api';

interface MetSearchParams {
  query: string;
  departmentId?: number;
  medium?: string;
  dateBegin?: number;
  dateEnd?: number;
  hasImages?: boolean;
  offset?: number;
  limit?: number;
}

export async function searchMet(params: MetSearchParams): Promise<MetSearchResponse> {
  return invokeFunction('met-museum', { action: 'search', ...params }, 'Met Museum');
}

export async function getMetObject(objectId: number): Promise<MetObjectResponse> {
  return invokeFunction('met-museum', { action: 'object', objectId }, 'Met Museum');
}

export async function batchFetchMetObjects(objectIds: number[]): Promise<MetObjectResponse[]> {
  return invokeFunction('met-museum', { action: 'batch', objectIds }, 'Met Museum');
}
