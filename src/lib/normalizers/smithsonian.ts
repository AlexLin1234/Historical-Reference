import type { NormalizedArtifact } from '@/types/artifact';

export function normalizeSmithsonianItem(item: any): NormalizedArtifact {
  const content = item.content || {};
  const descriptive = content.descriptiveNonRepeating || {};
  const freetext = content.freetext || {};
  const indexed = content.indexedStructured || {};

  // Extract image
  const media = descriptive.online_media?.media?.[0];
  const imageId = media?.idsId;
  const primaryImage = imageId
    ? `https://ids.si.edu/ids/deliveryService?id=${imageId}`
    : media?.thumbnail || null;

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
    primaryImageSmall: primaryImage,
    additionalImages: [],

    department: item.unitCode || null,
    gallery: null,
    country: null,
    region: indexed.place?.[0] || null,
    creditLine: 'Smithsonian Institution',

    sourceUrl: `https://collections.si.edu/search/detail/${item.id}`,

    isPublicDomain: descriptive.metadata_usage?.access === 'CC0' || false,
  };
}
