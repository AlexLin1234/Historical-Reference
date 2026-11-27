import { describe, expect, it } from 'vitest';
import type { NormalizedArtifact } from '@/types/artifact';
import { REGIONS, getRegion, matchesRegion } from '@/lib/search/regions';
import { paramsToSearch, searchToParams } from '@/lib/search/url';
import { withinRange } from '@/lib/search/dateFilter';

function art(over: Partial<NormalizedArtifact>): NormalizedArtifact {
  return {
    id: 'met-1', sourceId: '1', source: 'met', title: 'Untitled', date: '',
    dateEarliest: null, dateLatest: null, period: null, culture: null, classification: null,
    objectType: null, medium: null, dimensions: null, artist: null, artistBio: null,
    description: null, primaryImage: null, primaryImageSmall: null, additionalImages: [],
    department: null, gallery: null, country: null, region: null, creditLine: null,
    sourceUrl: 'https://example.org', isPublicDomain: true, ...over,
  };
}

describe('regions', () => {
  it('have unique ids and names the edge functions accept', () => {
    expect(new Set(REGIONS.map((r) => r.id)).size).toBe(REGIONS.length);
    const plain = /^\p{L}[\p{L} .'-]{0,59}$/u; // mirrors placeList in _shared/cors.ts
    for (const r of REGIONS) {
      expect(r.places.length).toBeGreaterThan(0);
      for (const name of [...r.places, ...r.cultures]) expect(name).toMatch(plain);
    }
  });

  it('matches place, culture and city names as whole words', () => {
    expect(matchesRegion(art({ culture: 'German, Nuremberg' }), 'german-lands')).toBe(true);
    expect(matchesRegion(art({ country: 'Augsburg' }), 'german-lands')).toBe(true);
    expect(matchesRegion(art({ culture: 'Japanese' }), 'german-lands')).toBe(false);
    expect(matchesRegion(art({ country: 'Somalia' }), 'africa')).toBe(false);
    expect(matchesRegion(art({ country: 'Mali' }), 'africa')).toBe(true);
  });

  it('keeps records with no place unless asked not to', () => {
    expect(matchesRegion(art({}), 'france')).toBe(true);
    expect(matchesRegion(art({}), 'france', false)).toBe(false);
    expect(matchesRegion(art({ culture: 'Italian' }), null)).toBe(true);
  });

  it('round-trips through the URL and ignores unknown ids', () => {
    const { filters } = paramsToSearch(new URLSearchParams('q=sallet&region=italy'));
    expect(filters.region).toBe('italy');
    expect(searchToParams(filters)).toContain('region=italy');
    expect(paramsToSearch(new URLSearchParams('region=atlantis')).filters.region).toBeNull();
    expect(getRegion('italy')?.label).toBe('Italy');
  });
});

describe('withinRange (date filter)', () => {
  const wotr = { startYear: 1455, endYear: 1487 };
  it('drops undated pieces unless the museum checked the date', () => {
    expect(withinRange(art({}), wotr)).toBe(false);
    expect(withinRange(art({}), wotr, true)).toBe(true);
    expect(withinRange(art({}), null)).toBe(true);
  });
  it('keeps overlapping dates and drops the rest', () => {
    expect(withinRange(art({ dateEarliest: 1470, dateLatest: 1480 }), wotr)).toBe(true);
    expect(withinRange(art({ dateEarliest: 1401, dateLatest: 1500 }), wotr)).toBe(true);
    expect(withinRange(art({ dateEarliest: 1600, dateLatest: 1650 }), wotr, true)).toBe(false);
  });
  it('drops pieces whose span dwarfs the range', () => {
    expect(withinRange(art({ dateEarliest: 1100, dateLatest: 1980 }), wotr, true)).toBe(false);
    expect(withinRange(art({ dateEarliest: 1300, dateLatest: 1500 }), wotr)).toBe(false);
    expect(withinRange(art({ dateEarliest: 1300, dateLatest: 1500 }), { startYear: 1300, endYear: 1500 })).toBe(true);
  });
});
