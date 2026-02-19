import type { NormalizedArtifact } from '@/types/artifact';
import type { HarvardObject } from '@/lib/api/harvard';

export function normalizeHarvardObject(item: HarvardObject): NormalizedArtifact {
  const primaryImage = item.primaryimageurl || null;
  const additionalImages = (item.images || [])
    .map((img) => img.baseimageurl)
    .filter((url) => url && url !== primaryImage);

  const artist = item.people?.[0]?.displayname || null;
  const artistBio = item.people?.[0]?.role || null;

  return {
    id: `harvard-${item.objectid}`,
    sourceId: String(item.objectid),
    source: 'harvard',

    title: item.title || 'Untitled',
    date: item.dated || '',
    dateEarliest: item.datebegin || null,
    dateLatest: item.dateend || null,
    period: item.century || null,
    culture: item.culture || item.people?.[0]?.culture || null,
    classification: item.classification || null,
    objectType: item.classification || null,
    medium: item.medium || item.technique || null,
    dimensions: item.dimensions || null,

    artist,
    artistBio,

    description: null,

    primaryImage,
    primaryImageSmall: primaryImage,
    additionalImages,

    department: item.department || null,
    gallery: null,
    country: null,
    region: null,
    creditLine: item.creditline || null,

    sourceUrl: item.url || `https://harvardartmuseums.org/collections/object/${item.objectid}`,

    isPublicDomain: item.imagepermissionlevel === 0,
  };
}
