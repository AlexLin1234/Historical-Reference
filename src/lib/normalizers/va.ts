import type { VASearchRecord, VAObjectResponse } from '@/types/api';
import type { NormalizedArtifact } from '@/types/artifact';
import { parseYearRange } from '@/lib/dates';

function buildVAImageUrl(iiifBase: string | null, size: 'thumb' | 'full'): string | null {
  if (!iiifBase) return null;
  iiifBase = iiifBase.replace(/\/+$/, ''); // the API returns a trailing slash
  const dim = size === 'thumb' ? '!400,400' : '!1200,1200';
  return `${iiifBase}/full/${dim}/0/default.jpg`;
}

/** The V&A records anonymous makers as "Unknown". */
function knownMaker(name: string | null | undefined): string | null {
  return name && !/^unknown$/i.test(name.trim()) ? name : null;
}

function toYear(value: string | null | undefined): number | null {
  if (!value) return null;
  // "1470-01-01", "-0300-01-01" or a bare year
  const m = /^(-?\d{1,4})/.exec(value.trim());
  return m ? parseInt(m[1], 10) : null;
}

/** V&A dimensions arrive as [{dimension, value, unit, qualifier, part}]. */
function formatVADimensions(dims: unknown): string | null {
  if (typeof dims === 'string') return dims || null;
  if (!Array.isArray(dims)) return null;
  const parts = dims
    .map((d: Record<string, string>) => {
      if (!d || !d.value) return null;
      const label = [d.part, d.dimension].filter(Boolean).join(' ');
      return `${label ? label + ': ' : ''}${d.value}${d.unit ? ' ' + d.unit : ''}${
        d.qualifier ? ` (${d.qualifier})` : ''
      }`;
    })
    .filter(Boolean);
  return parts.length ? parts.join('; ') : null;
}

export function normalizeVASearchRecord(raw: VASearchRecord): NormalizedArtifact {
  const years = parseYearRange(raw._primaryDate);
  return {
    id: `va-${raw.systemNumber}`,
    sourceId: raw.systemNumber,
    source: 'va',
    title: raw._primaryTitle || raw.objectType || 'Untitled',
    date: raw._primaryDate || '',
    dateEarliest: years?.earliest ?? null,
    dateLatest: years?.latest ?? null,
    period: null,
    classification: raw.objectType || null,
    objectType: raw.objectType || null,
    medium: null,
    dimensions: null,
    artist: knownMaker(raw._primaryMaker?.name),
    artistBio: null,
    description: null,
    primaryImage: buildVAImageUrl(raw._images?._iiif_image_base_url, 'full'),
    // _primary_thumbnail is only 100px; ask the image server for a card-sized one.
    primaryImageSmall:
      buildVAImageUrl(raw._images?._iiif_image_base_url, 'thumb') ||
      raw._images?._primary_thumbnail ||
      null,
    additionalImages: [],
    department: null,
    gallery: raw._currentLocation?.displayName || null,
    culture: raw._primaryPlace || null,
    country: raw._primaryPlace || null,
    region: null,
    creditLine: null,
    sourceUrl: `https://collections.vam.ac.uk/item/${raw.systemNumber}`,
    // V&A images are free for non-commercial use, not public domain.
    isPublicDomain: false,
    accessionNumber: raw.accessionNumber || null,
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
    dateEarliest: toYear(firstDate?.earliest) ?? parseYearRange(firstDate?.text)?.earliest ?? null,
    dateLatest: toYear(firstDate?.latest) ?? parseYearRange(firstDate?.text)?.latest ?? null,
    period: null,
    culture: null,
    classification: record.objectType || null,
    objectType: record.objectType || null,
    medium:
      record.materialsAndTechniques ||
      record.materials?.map((m) => m.text).join(', ') ||
      null,
    dimensions: formatVADimensions(record.dimensions),
    artist: knownMaker(record.artistMakerPerson?.[0]?.name?.text),
    artistBio: null,
    description:
      [record.summaryDescription, record.physicalDescription]
        .filter(Boolean)
        .map((t) => t.replace(/<[^>]*>/g, ''))
        .join('\n\n') ||
      record.briefDescription ||
      null,
    primaryImage: buildVAImageUrl(meta.images?._iiif_image ?? null, 'full'),
    primaryImageSmall:
      buildVAImageUrl(meta.images?._iiif_image ?? null, 'thumb') ||
      meta.images?._primary_thumbnail ||
      null,
    additionalImages: (meta.images?._alt_iiif_image || [])
      .map((url) => buildVAImageUrl(url, 'full'))
      .filter((url): url is string => url !== null),
    department: record.categories?.[0]?.text || null,
    gallery: record.galleryLocations?.[0]?.current?.text || null,
    country: record.placesOfOrigin?.[0]?.place?.text || null,
    region: null,
    creditLine: record.creditLine || null,
    sourceUrl:
      meta._links?.collection_page?.href ||
      `https://collections.vam.ac.uk/item/${record.systemNumber}`,
    isPublicDomain: false,
    accessionNumber: record.accessionNumber || null,
  };
}
