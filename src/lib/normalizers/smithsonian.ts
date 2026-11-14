import type { NormalizedArtifact } from '@/types/artifact';
import { stripHtml } from '@/lib/utils';
import { parseYearRange } from '@/lib/dates';

interface LabelledText {
  label?: string;
  content?: string;
}

interface SmithsonianMedia {
  thumbnail?: string;
  content?: string;
  idsId?: string;
  type?: string;
}

export interface SmithsonianItem {
  id: string;
  title?: string;
  unitCode?: string;
  content?: {
    descriptiveNonRepeating?: {
      title?: { content?: string };
      record_link?: string;
      guid?: string;
      data_source?: string;
      metadata_usage?: { access?: string };
      online_media?: { media?: SmithsonianMedia[] };
    };
    freetext?: Record<string, LabelledText[] | undefined>;
    indexedStructured?: {
      date?: string[];
      object_type?: string[];
      place?: string[];
      topic?: string[];
      culture?: string[];
    };
  };
}

function mediaUrl(m: SmithsonianMedia | undefined): string | null {
  if (!m) return null;
  if (m.idsId) return `https://ids.si.edu/ids/deliveryService?id=${encodeURIComponent(m.idsId)}`;
  return m.content || m.thumbnail || null;
}

function sized(url: string | null, max: number): string | null {
  if (!url || !url.includes('ids.si.edu/ids/deliveryService')) return url;
  return `${url}&max=${max}`;
}

/** Join the freetext entries of one kind, optionally only those with a label. */
function freetextOf(
  entries: LabelledText[] | undefined,
  labels?: RegExp
): string | null {
  const parts = (entries || [])
    .filter((e) => e.content && (!labels || (e.label && labels.test(e.label))))
    .map((e) => stripHtml(e.content!).trim())
    .filter(Boolean);
  return parts.length ? [...new Set(parts)].join('; ') : null;
}

export function normalizeSmithsonianItem(item: SmithsonianItem): NormalizedArtifact {
  const content = item.content || {};
  const descriptive = content.descriptiveNonRepeating || {};
  const freetext = content.freetext || {};
  const indexed = content.indexedStructured || {};

  const allMedia = descriptive.online_media?.media || [];
  const imageMedia = allMedia.filter((m) => m.type === 'Images');
  const first = imageMedia[0];
  const primaryImage = mediaUrl(first);
  const additionalImages = imageMedia
    .slice(1)
    .map((m) => sized(mediaUrl(m), 1200))
    .filter((u): u is string => !!u);

  // The indexed date is a decade bucket ("1860s"); prefer the precise text.
  const dateStr = freetext.date?.[0]?.content || indexed.date?.[0] || '';
  const years = parseYearRange(dateStr) ?? parseYearRange(indexed.date?.[0]);

  const title = stripHtml(descriptive.title?.content || item.title || 'Untitled');

  const dimensions = freetextOf(freetext.physicalDescription, /dimension|measurement/i);
  const medium =
    freetextOf(freetext.physicalDescription, /medium|material|physical description/i) ||
    (dimensions ? null : freetextOf(freetext.physicalDescription));
  const description =
    freetextOf(freetext.notes, /description|summary|label|caption/i) ||
    freetextOf(freetext.notes);

  return {
    id: `smithsonian-${item.id}`,
    sourceId: item.id,
    source: 'smithsonian',

    title,
    date: dateStr,
    dateEarliest: years?.earliest ?? null,
    dateLatest: years?.latest ?? null,
    period: null,
    culture: indexed.culture?.[0] || null,
    classification: indexed.object_type?.[0] || freetext.objectType?.[0]?.content || null,
    objectType: freetext.objectType?.[0]?.content || indexed.object_type?.[0] || null,
    medium,
    dimensions,

    artist: freetextOf(freetext.name, /maker|artist|manufacturer|designer|creator|author|photographer/i),
    artistBio: null,

    description,

    primaryImage: sized(primaryImage, 1600),
    primaryImageSmall: first?.thumbnail || sized(primaryImage, 400),
    additionalImages,

    department: descriptive.data_source || freetextOf(freetext.dataSource) || item.unitCode || null,
    gallery: null,
    country: indexed.place?.[0] || null,
    region: indexed.place?.slice(1).join(', ') || null,
    creditLine: freetextOf(freetext.creditLine) || 'Smithsonian Institution',

    sourceUrl:
      descriptive.record_link || descriptive.guid || `https://www.si.edu/object/${item.id}`,

    isPublicDomain: descriptive.metadata_usage?.access === 'CC0',
    accessionNumber: freetextOf(freetext.identifier, /accession|catalog|id number|object number/i),
  };
}
