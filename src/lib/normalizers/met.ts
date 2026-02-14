import type { MetObjectResponse } from '@/types/api';
import type { NormalizedArtifact } from '@/types/artifact';

export function normalizeMetObject(raw: MetObjectResponse): NormalizedArtifact {
  return {
    id: `met-${raw.objectID}`,
    sourceId: String(raw.objectID),
    source: 'met',
    title: raw.title || 'Untitled',
    date: raw.objectDate || '',
    dateEarliest: raw.objectBeginDate || null,
    dateLatest: raw.objectEndDate || null,
    period: raw.period || null,
    culture: raw.culture || null,
    classification: raw.classification || null,
    objectType: raw.objectName || null,
    medium: raw.medium || null,
    dimensions: raw.dimensions || null,
    artist: raw.artistDisplayName || null,
    artistBio: raw.artistDisplayBio || null,
    description: null,
    primaryImage: raw.primaryImage || null,
    primaryImageSmall: raw.primaryImageSmall || null,
    additionalImages: raw.additionalImages || [],
    department: raw.department || null,
    gallery: raw.GalleryNumber || null,
    country: raw.country || null,
    region: raw.region || null,
    creditLine: raw.creditLine || null,
    sourceUrl:
      raw.linkResource ||
      `https://www.metmuseum.org/art/collection/search/${raw.objectID}`,
    isPublicDomain: raw.isPublicDomain,
  };
}
