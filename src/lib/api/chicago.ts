import { invokeFunction } from './invoke';

interface ChicagoSearchParams {
  query: string;
  limit?: number;
  page?: number;
  hasImage?: boolean;
  dateFrom?: number;
  dateTo?: number;
  artworkTypes?: string[];
  /** Matched against place_of_origin (OR-ed). */
  places?: string[];
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
  main_reference_number?: string | null;
  artwork_type_title?: string | null;
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
  return invokeFunction('chicago-museum', {
      action: 'search',
      query: params.query,
      limit: params.limit || 20,
      page: params.page || 1,
      hasImage: params.hasImage,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      artworkTypes: params.artworkTypes,
      places: params.places,
    }, 'Art Institute of Chicago');
}

export async function getChicagoArtwork(artworkId: number): Promise<{ data: ChicagoArtwork; config: { iiif_url: string } }> {
  return invokeFunction('chicago-museum', { action: 'object', artworkId }, 'Art Institute of Chicago');
}
