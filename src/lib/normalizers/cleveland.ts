import type { ClevelandArtwork } from '@/types/api';
import type { NormalizedArtifact } from '@/types/artifact';

export function normalizeClevelandArtwork(raw: ClevelandArtwork): NormalizedArtifact {
  return {
    id: `cma-${raw.id}`,
    sourceId: String(raw.id),
    source: 'cleveland',
    title: raw.title || 'Untitled',
    date: raw.creation_date || '',
    dateEarliest: raw.creation_date_earliest ?? null,
    dateLatest: raw.creation_date_latest ?? null,
    period: null,
    culture: raw.culture?.join(', ') || null,
    classification: raw.type || null,
    objectType: raw.type || null,
    medium: raw.technique || null,
    dimensions: raw.measurements || null,
    artist: raw.creators?.[0]?.description || null,
    artistBio: raw.creators?.[0]?.biography || null,
    description: raw.description || null,
    primaryImage: raw.images?.web?.url || null,
    primaryImageSmall: raw.images?.web?.url || null,
    additionalImages: (raw.alternate_images || [])
      .map((img) => img.web?.url)
      .filter((url): url is string => url != null),
    department: raw.department || null,
    gallery: null,
    country: null,
    region: null,
    creditLine: raw.creditline || null,
    sourceUrl: raw.url || `https://www.clevelandart.org/art/${raw.accession_number}`,
    isPublicDomain: raw.share_license_status === 'CC0',
  };
}
