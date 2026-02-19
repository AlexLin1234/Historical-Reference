import type { NormalizedArtifact } from '@/types/artifact';
import type { ChicagoArtwork } from '@/lib/api/chicago';
import { stripHtml } from '@/lib/utils';

const DEFAULT_IIIF_URL = 'https://www.artic.edu/iiif/2';

export function normalizeChicagoArtwork(
  item: ChicagoArtwork,
  iiifUrl: string = DEFAULT_IIIF_URL
): NormalizedArtifact {
  const imageUrl = item.image_id
    ? `${iiifUrl}/${item.image_id}/full/843,/0/default.jpg`
    : null;
  const imageSmall = item.image_id
    ? `${iiifUrl}/${item.image_id}/full/400,/0/default.jpg`
    : null;

  return {
    id: `chicago-${item.id}`,
    sourceId: String(item.id),
    source: 'chicago',

    title: item.title ? stripHtml(item.title) : 'Untitled',
    date: item.date_display || '',
    dateEarliest: item.date_start || null,
    dateLatest: item.date_end || null,
    period: null,
    culture: item.place_of_origin || null,
    classification: item.classification_title || null,
    objectType: item.classification_title || null,
    medium: item.medium_display || null,
    dimensions: item.dimensions || null,

    artist: item.artist_display ? stripHtml(item.artist_display) : null,
    artistBio: null,

    description: item.description ? stripHtml(item.description) : null,

    primaryImage: imageUrl,
    primaryImageSmall: imageSmall,
    additionalImages: [],

    department: item.department_title || null,
    gallery: null,
    country: item.place_of_origin || null,
    region: null,
    creditLine: item.credit_line || null,

    sourceUrl: `https://www.artic.edu/artworks/${item.id}`,

    isPublicDomain: item.is_public_domain ?? false,
  };
}
