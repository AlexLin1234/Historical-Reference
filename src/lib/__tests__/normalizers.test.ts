import { describe, expect, it } from 'vitest';
import { normalizeMiaObject } from '@/lib/normalizers/mia';
import { normalizeEuropeanaItem, europeanaRecordId } from '@/lib/normalizers/europeana';
import { normalizeVASearchRecord } from '@/lib/normalizers/va';
import { normalizeMetObject } from '@/lib/normalizers/met';
import { buildCitation } from '@/lib/citation';
import { guessKitSlot, matchesCategory } from '@/lib/search/categories';
import type { VASearchRecord, MetObjectResponse } from '@/types/api';

// Fixtures are trimmed copies of live API responses.

describe('Minneapolis Institute of Art', () => {
  const a = normalizeMiaObject({
    id: 14148, title: 'Armor', medium: 'Steel, leather, copper alloy', classification: 'Arms and Armor',
    dimension: '77 x 31 1/2in. (195.6 x 80cm)', object_name: 'Armor', country: 'Germany',
    nationality: 'German', dated: 'c. 1520', room: 'G340', creditline: 'The Washburn Fund',
    accession_number: '23.54', artist: 'Germany', department: 'European Art',
    rights_type: 'Public Domain', image: 'valid',
  });
  it('builds sharded image URLs and parses the date', () => {
    expect(a.primaryImageSmall).toBe('https://1.api.artsmia.org/14148.jpg');
    expect(a.primaryImage).toBe('https://1.api.artsmia.org/800/14148.jpg');
    expect([a.dateEarliest, a.dateLatest]).toEqual([1520, 1520]);
  });
  it('does not treat the country as the artist', () => {
    expect(a.artist).toBeNull();
    expect(a.culture).toBe('German');
  });
  it('hides restricted images', () => {
    expect(normalizeMiaObject({ id: 1, image: 'valid', restricted: 1 }).primaryImage).toBeNull();
  });
});

describe('Europeana', () => {
  const a = normalizeEuropeanaItem({
    id: '/91619/SMVK_EM_objekt_1238916',
    title: ['Sword, värd ceremonial, eben'],
    country: ['Sweden'], dataProvider: ['Museum of Ethnography'],
    rights: ['http://creativecommons.org/publicdomain/zero/1.0/'],
    edmPreview: ['https://api.europeana.eu/thumbnail/v2/url.json?uri=x&type=IMAGE'],
    edmIsShownAt: ['https://collections.smvk.se/carlotta-em/web/object/1238916'],
    dcTitleLangAware: { sv: ['svärd'], en: ['Sword, ceremonial'] },
    dcDescriptionLangAware: { def: ['1906.35.0001'], en: ['Nigeria', 'A sword, which according to the general catalog is of iron.'] },
    dcTypeLangAware: { def: ['http://data.europeana.eu/concept/1916'], sv: ['svärd'] },
    year: ['1850'],
  });
  it('prefers English text and skips URIs and fragments', () => {
    expect(a.title).toBe('Sword, ceremonial');
    expect(a.description).toBe('A sword, which according to the general catalog is of iron.');
    expect(a.classification).toBe('svärd');
  });
  it('round-trips the record id through a URL-safe source id', () => {
    expect(a.sourceId).toBe('91619:SMVK_EM_objekt_1238916');
    expect(europeanaRecordId(a.sourceId)).toBe('/91619/SMVK_EM_objekt_1238916');
  });
  it('cites the holding institution', () => {
    expect(a.isPublicDomain).toBe(true);
    expect(buildCitation(a, new Date('2026-11-14'))).toBe(
      'Sword, ceremonial, 1850. Museum of Ethnography, Sweden (via Europeana). https://collections.smvk.se/carlotta-em/web/object/1238916 (accessed 14 November 2026).'
    );
  });
});

describe('V&A', () => {
  const a = normalizeVASearchRecord({
    systemNumber: 'O474802', accessionNumber: '1425-1855', objectType: 'Sword', _primaryTitle: '',
    _primaryMaker: { name: 'Unknown', association: '' }, _primaryImageId: '2020MN9344',
    _primaryDate: '16th century', _primaryPlace: 'Deccan',
    _images: {
      _primary_thumbnail: 'https://framemark.vam.ac.uk/collections/2020MN9344/full/!100,100/0/default.jpg',
      _iiif_image_base_url: 'https://framemark.vam.ac.uk/collections/2020MN9344/',
      _iiif_presentation_url: null, imageResolution: 'high',
    },
  } as unknown as VASearchRecord);
  it('falls back to the object type, drops "Unknown" and dates the record', () => {
    expect(a.title).toBe('Sword');
    expect(a.artist).toBeNull();
    expect([a.dateEarliest, a.dateLatest]).toEqual([1501, 1600]);
  });
  it('builds IIIF URLs without a double slash', () => {
    expect(a.primaryImageSmall).toBe('https://framemark.vam.ac.uk/collections/2020MN9344/full/!400,400/0/default.jpg');
  });
});

describe('Met', () => {
  it('treats 0/0 dates as unknown but keeps BCE dates', () => {
    const base = { objectID: 1, title: 'x', additionalImages: [], isPublicDomain: true } as unknown as MetObjectResponse;
    expect(normalizeMetObject({ ...base, objectBeginDate: 0, objectEndDate: 0 }).dateEarliest).toBeNull();
    expect(normalizeMetObject({ ...base, objectBeginDate: -500, objectEndDate: -400 }).dateEarliest).toBe(-500);
  });
});

describe('categories', () => {
  const base = normalizeMiaObject({ id: 2, title: 'Sallet', object_name: 'Sallet', classification: 'Arms and Armor' });
  it('classifies kit slots and categories', () => {
    expect(guessKitSlot(base)).toBe('Headwear & helmets');
    expect(matchesCategory(base, 'arms-armor')).toBe(true);
    expect(matchesCategory(base, 'ceramics')).toBe(false);
    expect(guessKitSlot({ ...base, title: 'Turnshoe', objectType: 'Shoe', classification: 'Costume' })).toBe('Footwear & legwear');
  });
});
