import type { NormalizedArtifact } from '@/types/artifact';
import type { EuropeanaItem } from '@/lib/api/europeana';
import { parseYearRange } from '@/lib/dates';

type LangMap = Record<string, string[]> | undefined;

const isUri = (s: string) => /^https?:\/\//i.test(s);

/** Prefer English, then language-neutral, then whatever exists; skip URIs. */
function pick(map: LangMap, fallback?: string[]): string[] {
  const lists = [map?.en, map?.def, ...(map ? Object.values(map) : []), fallback];
  for (const list of lists) {
    const clean = (list || []).filter((v) => typeof v === 'string' && v.trim() && !isUri(v));
    if (clean.length > 0) return clean;
  }
  return [];
}

/** "/91619/SMVK_EM_1" ⇄ "91619:SMVK_EM_1" (safe inside a URL path segment). */
export function europeanaSourceId(recordId: string): string {
  return recordId.replace(/^\//, '').replace('/', ':');
}

export function europeanaRecordId(sourceId: string): string {
  return '/' + sourceId.replace(':', '/');
}

export function normalizeEuropeanaItem(raw: EuropeanaItem): NormalizedArtifact {
  const titles = pick(raw.dcTitleLangAware, raw.title);
  const descriptions = pick(raw.dcDescriptionLangAware, raw.dcDescription);
  // Drop one-word catalogue fragments ("Nigeria", an inventory number).
  const prose = descriptions.filter((d) => d.length > 25);
  const description = (prose.length > 0 ? prose : descriptions).join('\n\n') || null;

  const types = pick(raw.dcTypeLangAware);
  const concepts = pick(raw.edmConceptPrefLabelLangAware);
  const year = raw.year?.[0] ?? '';
  const years = parseYearRange(year) ?? (/^-?\d{1,4}$/.test(year)
    ? { earliest: parseInt(year, 10), latest: parseInt(year, 10) }
    : null);

  const holder = raw.dataProvider?.[0] || raw.provider?.[0] || null;
  const rights = raw.rights?.[0] || '';
  const sourceId = europeanaSourceId(raw.id);
  const link = raw.edmIsShownAt?.find(isUri) || (raw.guid ? raw.guid.split('?')[0] : null);
  const full = raw.edmIsShownBy?.find(isUri) || null;
  const preview = raw.edmPreview?.find(isUri) || null;
  const place = pick(raw.edmPlaceLabelLangAware)[0] || null;

  return {
    id: `europeana-${sourceId}`,
    sourceId,
    source: 'europeana',
    title: titles[0] || types[0] || 'Untitled',
    date: year,
    dateEarliest: years?.earliest ?? null,
    dateLatest: years?.latest ?? null,
    period: null,
    culture: place,
    classification: types[0] || concepts[0] || null,
    objectType: concepts[0] || types[0] || null,
    medium: null,
    dimensions: null,
    artist: pick(raw.dcCreatorLangAware, raw.dcCreator)[0] || null,
    artistBio: null,
    description,
    primaryImage: full || preview,
    primaryImageSmall: preview || full,
    additionalImages: [],
    department: holder,
    gallery: null,
    country: place,
    region: null,
    creditLine: holder,
    sourceUrl: link || `https://www.europeana.eu/item/${sourceId.replace(':', '/')}`,
    isPublicDomain: /publicdomain/i.test(rights),
    holder: holder ? `${holder}${raw.country?.[0] ? `, ${raw.country[0]}` : ''} (via Europeana)` : 'Europeana',
  };
}
