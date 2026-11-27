import { invokeFunction } from './invoke';

interface HarvardSearchParams {
  query: string;
  size?: number;
  page?: number;
  hasImage?: boolean;
  classification?: string;
  /** Culture names (OR-ed). */
  cultures?: string[];
  dateFrom?: number;
  dateTo?: number;
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
  description?: string | null;
  labeltext?: string | null;
}

export async function searchHarvard(params: HarvardSearchParams): Promise<HarvardSearchResponse> {
  return invokeFunction('harvard-museum', {
      action: 'search',
      query: params.query,
      size: params.size || 20,
      page: params.page || 1,
      hasImage: params.hasImage,
      classification: params.classification,
      cultures: params.cultures,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
    }, 'Harvard Art Museums');
}

export async function getHarvardObject(objectId: number): Promise<HarvardObject> {
  return invokeFunction('harvard-museum', { action: 'object', objectId }, 'Harvard Art Museums');
}
