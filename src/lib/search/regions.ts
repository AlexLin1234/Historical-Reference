import type { NormalizedArtifact } from '@/types/artifact';

/**
 * Regions a search can be limited to. Each museum is filtered on its own
 * place field (see `src/lib/api/search.ts`):
 *
 *   places   country names: Met `geoLocation`, Cleveland `culture`,
 *            Smithsonian `place:`, Europeana `where:`, Chicago
 *            `place_of_origin`, Mia `country:`, and the V&A query text.
 *            Met, Cleveland and the V&A take one place per request, so they
 *            use only the first few, most productive, entries.
 *   cultures adjectives: Harvard `culture:`.
 *   extra    further names (cities, historic states) used only when matching
 *            records in the browser, e.g. semantic-index results.
 *
 * Verified against the live APIs on 2026-11-27 (helmets, Germany: Met
 * 8,071 → 726, Cleveland 187 → 51, Smithsonian 3,923 → 177, Harvard
 * 8,780 → 655, Europeana 23,032 → 335).
 */
export interface Region {
  id: string;
  label: string;
  places: string[];
  cultures: string[];
  extra?: string[];
}

export const REGIONS: Region[] = [
  {
    id: 'british-isles',
    label: 'British Isles',
    places: ['England', 'Scotland', 'Ireland', 'Wales', 'Great Britain', 'United Kingdom'],
    cultures: ['British', 'English', 'Scottish', 'Irish', 'Welsh', 'Anglo-Saxon'],
    extra: ['Britain', 'London', 'Edinburgh', 'Dublin', 'Northumbria', 'Mercia', 'Wessex'],
  },
  {
    id: 'france',
    label: 'France',
    places: ['France'],
    cultures: ['French', 'Frankish', 'Merovingian', 'Carolingian'],
    extra: ['Paris', 'Lyon', 'Burgundy', 'Normandy', 'Gaul', 'Limoges'],
  },
  {
    id: 'german-lands',
    label: 'German lands, Austria & Switzerland',
    places: ['Germany', 'Austria', 'Switzerland'],
    cultures: ['German', 'Austrian', 'Swiss', 'Germanic'],
    extra: ['Nuremberg', 'Augsburg', 'Cologne', 'Saxony', 'Bavaria', 'Prussia', 'Vienna', 'Innsbruck', 'Landshut'],
  },
  {
    id: 'low-countries',
    label: 'Low Countries',
    places: ['Netherlands', 'Belgium', 'Flanders'],
    cultures: ['Dutch', 'Flemish', 'Netherlandish', 'Belgian'],
    extra: ['Holland', 'Amsterdam', 'Antwerp', 'Brussels', 'Bruges', 'Delft', 'Haarlem'],
  },
  {
    id: 'italy',
    label: 'Italy',
    places: ['Italy'],
    cultures: ['Italian', 'Venetian', 'Florentine', 'Milanese', 'Lombard'],
    extra: ['Milan', 'Venice', 'Florence', 'Naples', 'Rome', 'Sicily', 'Genoa', 'Brescia'],
  },
  {
    id: 'iberia',
    label: 'Spain & Portugal',
    places: ['Spain', 'Portugal'],
    cultures: ['Spanish', 'Portuguese', 'Iberian', 'Visigothic', 'Hispano-Moresque'],
    extra: ['Toledo', 'Seville', 'Madrid', 'Lisbon', 'Catalonia', 'Castile', 'Andalusia'],
  },
  {
    id: 'scandinavia',
    label: 'Scandinavia & the Baltic',
    places: ['Sweden', 'Norway', 'Denmark', 'Iceland', 'Finland'],
    cultures: ['Swedish', 'Norwegian', 'Danish', 'Icelandic', 'Finnish', 'Scandinavian', 'Viking', 'Norse'],
    extra: ['Scandinavia', 'Gotland', 'Estonia', 'Latvia'],
  },
  {
    id: 'eastern-europe',
    label: 'Central & Eastern Europe',
    places: ['Poland', 'Hungary', 'Russia', 'Czech Republic', 'Bohemia', 'Ukraine', 'Lithuania', 'Slovakia'],
    cultures: ['Polish', 'Hungarian', 'Russian', 'Czech', 'Bohemian', 'Ukrainian', 'Lithuanian', 'Slavic', 'Avar'],
    extra: ['Moravia', 'Transylvania', 'Kraków', 'Krakow', 'Prague', 'Moscow', 'Silesia'],
  },
  {
    id: 'balkans-byzantium',
    label: 'Greece, Balkans & Byzantium',
    places: ['Greece', 'Bulgaria', 'Serbia', 'Romania', 'Croatia', 'Albania', 'Cyprus'],
    cultures: ['Greek', 'Byzantine', 'Bulgarian', 'Serbian', 'Romanian', 'Croatian', 'Balkan'],
    extra: ['Constantinople', 'Athens', 'Macedonia', 'Bosnia', 'Thrace', 'Crete'],
  },
  {
    id: 'middle-east',
    label: 'Middle East & North Africa',
    places: ['Turkey', 'Iran', 'Egypt', 'Syria', 'Iraq', 'Morocco', 'Tunisia', 'Lebanon', 'Israel'],
    cultures: ['Ottoman', 'Turkish', 'Persian', 'Iranian', 'Egyptian', 'Syrian', 'Mamluk', 'Moroccan', 'Coptic', 'Safavid'],
    extra: ['Anatolia', 'Persia', 'Mesopotamia', 'Damascus', 'Cairo', 'Istanbul', 'Levant', 'Palestine'],
  },
  {
    id: 'north-america',
    label: 'North America',
    places: ['United States', 'Canada'],
    cultures: ['American', 'Native American', 'Canadian'],
    extra: ['USA', 'New England', 'Massachusetts', 'Pennsylvania', 'Virginia', 'New York', 'Philadelphia', 'Boston', 'Connecticut'],
  },
  {
    id: 'latin-america',
    label: 'Mexico, Central & South America',
    places: ['Mexico', 'Peru', 'Guatemala', 'Brazil', 'Colombia', 'Bolivia', 'Ecuador', 'Argentina'],
    cultures: ['Mexican', 'Peruvian', 'Aztec', 'Maya', 'Inca', 'Moche', 'Brazilian', 'Colombian'],
    extra: ['Mesoamerica', 'Andes'],
  },
  {
    id: 'south-asia',
    label: 'South Asia',
    places: ['India', 'Pakistan', 'Nepal', 'Sri Lanka', 'Bangladesh', 'Afghanistan', 'Tibet'],
    cultures: ['Indian', 'Mughal', 'Rajput', 'Tibetan', 'Nepalese'],
    extra: ['Rajasthan', 'Deccan', 'Lahore', 'Delhi', 'Bengal', 'Gujarat'],
  },
  {
    id: 'east-asia',
    label: 'East Asia',
    places: ['Japan', 'China', 'Korea', 'Mongolia'],
    cultures: ['Japanese', 'Chinese', 'Korean', 'Mongolian', 'Mongol'],
    extra: ['Edo', 'Kyoto', 'Beijing'],
  },
  {
    id: 'africa',
    label: 'Sub-Saharan Africa',
    places: ['Nigeria', 'Ghana', 'Ethiopia', 'Democratic Republic of the Congo', 'Mali', 'Kenya', 'South Africa', 'Cameroon'],
    cultures: ['African', 'Yoruba', 'Asante', 'Akan', 'Zulu', 'Benin', 'Kongo', 'Ethiopian'],
    extra: ['Congo', 'Sudan', 'Tanzania', 'Zimbabwe'],
  },
];

const BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

export function getRegion(id: string | null | undefined): Region | null {
  return id ? BY_ID.get(id) ?? null : null;
}

function escape(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const patterns = new Map<string, RegExp>();

function patternFor(region: Region): RegExp {
  let re = patterns.get(region.id);
  if (!re) {
    const terms = [...region.places, ...region.cultures, ...(region.extra ?? [])];
    // Whole words only, so "Mali" does not match "Somalia".
    re = new RegExp(`(^|[^\\p{L}])(${terms.map(escape).join('|')})(?![\\p{L}])`, 'iu');
    patterns.set(region.id, re);
  }
  return re;
}

/** The place fields of a record, joined; empty when it records no place. */
function placeText(a: NormalizedArtifact): string {
  return [a.culture, a.country, a.region].filter(Boolean).join(' | ');
}

/**
 * Whether a record comes from the region. Records with no place recorded
 * count as a match only when `keepUnplaced` is set: many museums leave the
 * field empty, so keyword results keep them, while extra semantic matches
 * must show a place.
 */
export function matchesRegion(
  a: NormalizedArtifact,
  regionId: string | null | undefined,
  keepUnplaced = true
): boolean {
  const region = getRegion(regionId);
  if (!region) return true;
  const text = placeText(a);
  if (!text) return keepUnplaced;
  return patternFor(region).test(text);
}
