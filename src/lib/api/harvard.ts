import { getSupabase } from '@/lib/supabase';

interface HarvardSearchParams {
  query: string;
  size?: number;
  page?: number;
  hasImage?: boolean;
  classification?: string;
}

export interface HarvardSearchResponse {
  info: {
    totalrecordsperquery: number;
    totalrecords: number;
    pages: number;
    page: number;
  };
  records: HarvardObject[];
}

export interface HarvardObject {
  objectid: number;
  objectnumber: string;
  title: string;
  dated: string;
  datebegin: number;
  dateend: number;
  classification: string;
  medium: string;
  technique: string;
  dimensions: string;
  people: { displayname: string; role: string; culture: string }[] | null;
  culture: string;
  primaryimageurl: string | null;
  images: { baseimageurl: string; iiifbaseuri: string }[];
  department: string;
  century: string;
  url: string;
  creditline: string;
  imagepermissionlevel: number;
}

export async function searchHarvard(params: HarvardSearchParams): Promise<HarvardSearchResponse> {
  const { data, error } = await getSupabase().functions.invoke('harvard-museum', {
    body: {
      action: 'search',
      query: params.query,
      size: params.size || 20,
      page: params.page || 1,
      hasImage: params.hasImage,
      classification: params.classification,
    },
  });

  if (error) throw new Error(`Harvard search failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Harvard search failed');
  return data.data;
}

export async function getHarvardObject(objectId: number): Promise<HarvardObject> {
  const { data, error } = await getSupabase().functions.invoke('harvard-museum', {
    body: { action: 'object', objectId },
  });

  if (error) throw new Error(`Harvard fetch failed: ${error.message}`);
  if (!data.success) throw new Error(data.error || 'Harvard fetch failed');
  return data.data;
}
