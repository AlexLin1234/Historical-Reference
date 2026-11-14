import { invokeFunction } from './invoke';

export interface MiaObject {
  id: number;
  title?: string;
  medium?: string;
  classification?: string;
  dimension?: string;
  object_name?: string;
  country?: string;
  culture?: string | null;
  nationality?: string;
  dated?: string;
  style?: string | null;
  dynasty?: string;
  room?: string;
  creditline?: string;
  accession_number?: string;
  artist?: string;
  role?: string;
  life_date?: string;
  department?: string;
  rights_type?: string;
  image?: string;
  restricted?: number;
  text?: string;
  description?: string;
}

export interface MiaSearchResponse {
  total: number;
  records: MiaObject[];
}

interface MiaSearchParams {
  query: string;
  size?: number;
  from?: number;
  hasImage?: boolean;
  classifications?: string[];
}

export async function searchMia(params: MiaSearchParams): Promise<MiaSearchResponse> {
  return invokeFunction('mia-museum', { action: 'search', ...params }, 'Minneapolis Institute of Art');
}

export async function getMiaObject(objectId: number): Promise<MiaObject> {
  return invokeFunction('mia-museum', { action: 'object', objectId }, 'Minneapolis Institute of Art');
}
