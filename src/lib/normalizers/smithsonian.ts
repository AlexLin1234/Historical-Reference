import type { NormalizedArtifact } from '@/types/artifact';

export function normalizeSmithsonianItem(item: any): NormalizedArtifact {
  const content = item.content || {};
  const descriptive = content.descriptiveNonRepeating || {};
  const freetext = content.freetext || {};
  const indexed = content.indexedStructured || {};

  // Extract images
  const allMedia = descriptive.online_media?.media || [];
  const imageMedia = allMedia.filter((m: any) => m.type === 'Images');
  const media = imageMedia[0] || allMedia[0];
  const imageId = media?.idsId;
  const primaryImage = imageId
    ? `https://ids.si.edu/ids/deliveryService?id=${imageId}`
    : media?.content || media?.thumbnail || null;

  // Extract additional images beyond the first
  const additionalImages = imageMedia.slice(1).map((m: any) => {
    if (m.idsId) return `https://ids.si.edu/ids/deliveryService?id=${m.idsId}`;
    return m.content || m.thumbnail || null;
  }).filter(Boolean);

  // Extract date
  const dateStr = freetext.date?.[0]?.content || indexed.date?.[0] || '';
  const dateMatch = dateStr.match(/(\d{4})/);
  const year = dateMatch ? parseInt(dateMatch[1]) : null;

  // Extract title
  const title = descriptive.title?.content || item.title || 'Untitled';

  return {
    id: `smithsonian-${item.id}`,
    sourceId: item.id,
    source: 'smithsonian',

    title,
    date: dateStr,
    dateEarliest: year,
    dateLatest: year,
    period: null,
    culture: indexed.place?.[0] || null,
    classification: indexed.object_type?.[0] || freetext.objectType?.[0]?.content || null,
    objectType: indexed.object_type?.[0] || null,
    medium: freetext.physicalDescription?.[0]?.content || null,
    dimensions: null,

    artist: null,
    artistBio: null,

    description: freetext.dataSource?.[0]?.content || null,

    primaryImage,
    primaryImageSmall: media?.thumbnail || primaryImage,
    additionalImages,

    department: item.unitCode || null,
    gallery: null,
    country: null,
    region: indexed.place?.[0] || null,
    creditLine: 'Smithsonian Institution',

    sourceUrl: descriptive.record_link || descriptive.guid || `https://www.si.edu/object/${item.id}`,

    isPublicDomain: descriptive.metadata_usage?.access === 'CC0' || false,
  };
}
