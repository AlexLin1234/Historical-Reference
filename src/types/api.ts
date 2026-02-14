// ---------- Met Museum ----------

export interface MetSearchResponse {
  total: number;
  objectIDs: number[] | null;
}

export interface MetObjectResponse {
  objectID: number;
  isHighlight: boolean;
  accessionNumber: string;
  accessionYear: string;
  isPublicDomain: boolean;
  primaryImage: string;
  primaryImageSmall: string;
  additionalImages: string[];
  department: string;
  objectName: string;
  title: string;
  culture: string;
  period: string;
  dynasty: string;
  reign: string;
  artistDisplayName: string;
  artistDisplayBio: string;
  artistNationality: string;
  objectDate: string;
  objectBeginDate: number;
  objectEndDate: number;
  medium: string;
  dimensions: string;
  classification: string;
  country: string;
  region: string;
  city: string;
  creditLine: string;
  GalleryNumber: string;
  linkResource: string;
  rightsAndReproduction: string;
  tags: { term: string; AAT_URL: string; Wikidata_URL: string }[] | null;
}

// ---------- V&A Museum ----------

export interface VASearchResponse {
  info: {
    version: string;
    record_count: number;
    record_count_exact: boolean;
    page_size: number;
    pages: number;
    page: number;
    image_count: number;
  };
  records: VASearchRecord[];
}

export interface VASearchRecord {
  systemNumber: string;
  accessionNumber: string;
  objectType: string;
  _primaryTitle: string;
  _primaryMaker: { name: string; association: string };
  _primaryImageId: string | null;
  _primaryDate: string;
  _primaryPlace: string;
  _images: {
    _primary_thumbnail: string | null;
    _iiif_image_base_url: string | null;
    _iiif_presentation_url: string | null;
    imageResolution: string;
  };
  _currentLocation: {
    id: string;
    displayName: string;
    type: string;
    site: string;
    onDisplay: boolean;
  };
}

export interface VAObjectResponse {
  meta: {
    images: {
      _primary_thumbnail: string | null;
      _iiif_image: string | null;
      _alt_iiif_image: string[];
      imageResolution: string;
      _images_meta: { assetRef: string; copyright: string; sensitiveImage: boolean }[];
    };
    _links: { collection_page: { href: string } };
  };
  record: {
    systemNumber: string;
    accessionNumber: string;
    objectType: string;
    titles: { title: string; type: string }[];
    summaryDescription: string;
    physicalDescription: string;
    artistMakerPerson: { name: { text: string }; association: { text: string }; note: string }[];
    materials: { text: string }[];
    techniques: { text: string }[];
    materialsAndTechniques: string;
    categories: { text: string }[];
    placesOfOrigin: { place: { text: string }; association: { text: string } }[];
    productionDates: { date: { text: string; earliest: string; latest: string } }[];
    creditLine: string;
    dimensions: string;
    briefDescription: string;
    images: string[];
    galleryLocations: { current: { text: string } }[];
  };
}

// ---------- Cleveland Museum ----------

export interface ClevelandSearchResponse {
  info: {
    total: number;
    parameters: Record<string, unknown>;
  };
  data: ClevelandArtwork[];
}

export interface ClevelandArtwork {
  id: number;
  accession_number: string;
  share_license_status: string;
  tombstone: string;
  title: string;
  creation_date: string;
  creation_date_earliest: number | null;
  creation_date_latest: number | null;
  creators: { description: string; role: string; biography: string | null }[];
  culture: string[];
  technique: string;
  department: string;
  collection: string;
  type: string;
  measurements: string;
  dimensions: Record<string, unknown>;
  description: string;
  provenance: { description: string }[];
  citations: string;
  url: string;
  images: {
    web: { url: string; width: string; height: string } | null;
    print: { url: string; width: string; height: string } | null;
    full: { url: string; width: string; height: string } | null;
  } | null;
  alternate_images: {
    web: { url: string } | null;
    print: { url: string } | null;
  }[];
  creditline: string;
}

// ---------- Firecrawl ----------

export interface FirecrawlScrapeRequest {
  url: string;
  formats?: ('markdown' | 'html')[];
  onlyMainContent?: boolean;
  timeout?: number;
}

export interface FirecrawlScrapeResponse {
  success: boolean;
  data: {
    markdown: string;
    html?: string;
    metadata: {
      title: string;
      description: string;
      sourceURL: string;
      statusCode: number;
    };
  };
}
