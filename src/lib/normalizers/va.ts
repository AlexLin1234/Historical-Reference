import type { VASearchRecord, VAObjectResponse } from '@/types/api';
import type { NormalizedArtifact } from '@/types/artifact';

function buildVAImageUrl(iiifBase: string | null, size: 'thumb' | 'full'): string | null {
  if (!iiifBase) return null;
  const dim = size === 'thumb' ? '!400,400' : '!1200,1200';
  return `${iiifBase}/full/${dim}/0/default.jpg`;
}

export function normalizeVASearchRecord(raw: VASearchRecord): NormalizedArtifact {
  return {
    id: `va-${raw.systemNumber}`,
    sourceId: raw.systemNumber,
    source: 'va',
    title: raw._primaryTitle || 'Untitled',
    date: raw._primaryDate || '',
    dateEarliest: null,
    dateLatest: null,
    period: null,
    culture: null,
    classification: raw.objectType || null,
    objectType: raw.objectType || null,
    medium: null,
    dimensions: null,
    artist: raw._primaryMaker?.name || null,
    artistBio: null,
    description: null,
    primaryImage: buildVAImageUrl(raw._images?._iiif_image_base_url, 'full'),
    primaryImageSmall:
      raw._images?._primary_thumbnail ||
      buildVAImageUrl(raw._images?._iiif_image_base_url, 'thumb'),
    additionalImages: [],
    department: null,
    gallery: raw._currentLocation?.displayName || null,
    country: raw._primaryPlace || null,
    region: null,
    creditLine: null,
    sourceUrl: `https://collections.vam.ac.uk/item/${raw.systemNumber}`,
    isPublicDomain: true,
  };
}

export function normalizeVAObject(raw: VAObjectResponse): NormalizedArtifact {
  const record = raw.record;
  const meta = raw.meta;
  const firstDate = record.productionDates?.[0]?.date;

  return {
    id: `va-${record.systemNumber}`,
    sourceId: record.systemNumber,
    source: 'va',
    title: record.titles?.[0]?.title || record.objectType || 'Untitled',
    date: firstDate?.text || '',
    dateEarliest: firstDate?.earliest ? parseInt(firstDate.earliest) : null,
    dateLatest: firstDate?.latest ? parseInt(firstDate.latest) : null,
    period: null,
    culture: null,
    classification: record.objectType || null,
    objectType: record.objectType || null,
    medium:
      record.materialsAndTechniques ||
      record.materials?.map((m) => m.text).join(', ') ||
      null,
    dimensions: typeof record.dimensions === 'string' ? record.dimensions : null,
    artist: record.artistMakerPerson?.[0]?.name?.text || null,
    artistBio: null,
    description: record.briefDescription || record.summaryDescription || null,
    primaryImage: meta.images?._iiif_image
      ? `${meta.images._iiif_image}/full/!1200,1200/0/default.jpg`
      : null,
    primaryImageSmall: meta.images?._primary_thumbnail || null,
    additionalImages: (meta.images?._alt_iiif_image || []).map(
      (url) => `${url}/full/!800,800/0/default.jpg`
    ),
    department: record.categories?.[0]?.text || null,
    gallery: record.galleryLocations?.[0]?.current?.text || null,
    country: record.placesOfOrigin?.[0]?.place?.text || null,
    region: null,
    creditLine: record.creditLine || null,
    sourceUrl:
      meta._links?.collection_page?.href ||
      `https://collections.vam.ac.uk/item/${record.systemNumber}`,
    isPublicDomain: true,
  };
}
