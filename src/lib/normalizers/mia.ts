import type { NormalizedArtifact } from '@/types/artifact';
import type { MiaObject } from '@/lib/api/mia';
import { parseYearRange } from '@/lib/dates';
import { stripHtml } from '@/lib/utils';

/** Images are sharded over seven hosts by object id. */
function imageUrl(id: number, size?: 800): string {
  return `https://${id % 7}.api.artsmia.org/${size ? `${size}/` : ''}${id}.jpg`;
}

export function normalizeMiaObject(raw: MiaObject): NormalizedArtifact {
  const hasImage = raw.image === 'valid' && raw.restricted !== 1;
  const years = parseYearRange(raw.dated);
  // For anonymous works the "artist" field repeats the place or culture.
  const place = raw.country || raw.nationality || null;
  const artist =
    raw.artist && ![raw.country, raw.nationality, raw.culture, 'Unknown'].includes(raw.artist)
      ? raw.artist
      : null;

  return {
    id: `mia-${raw.id}`,
    sourceId: String(raw.id),
    source: 'mia',
    title: raw.title ? stripHtml(raw.title) : raw.object_name || 'Untitled',
    date: raw.dated || '',
    dateEarliest: years?.earliest ?? null,
    dateLatest: years?.latest ?? null,
    period: raw.dynasty || raw.style || null,
    culture: raw.culture || raw.nationality || raw.country || null,
    classification: raw.classification || null,
    objectType: raw.object_name || raw.classification || null,
    medium: raw.medium || null,
    dimensions: raw.dimension || null,
    artist,
    artistBio: artist ? raw.life_date || null : null,
    description: raw.text ? stripHtml(raw.text) : raw.description ? stripHtml(raw.description) : null,
    primaryImage: hasImage ? imageUrl(raw.id, 800) : null,
    primaryImageSmall: hasImage ? imageUrl(raw.id) : null,
    additionalImages: [],
    department: raw.department || null,
    gallery: raw.room && raw.room !== 'Not on View' ? raw.room : null,
    country: place,
    region: null,
    creditLine: raw.creditline || null,
    sourceUrl: `https://collections.artsmia.org/art/${raw.id}`,
    isPublicDomain: raw.rights_type === 'Public Domain',
    accessionNumber: raw.accession_number || null,
  };
}
