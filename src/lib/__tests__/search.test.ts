import { describe, expect, it } from 'vitest';
import type { NormalizedArtifact, MuseumSource } from '@/types/artifact';
import { parseQuery } from '@/lib/search/query';
import { relatedSearches, suggestCorrection, toDialect, normalizeTerm } from '@/lib/search/lexicon';
import { rankArtifacts, tokenMatch } from '@/lib/search/ranking';

let n = 0;
function art(over: Partial<NormalizedArtifact>, source: MuseumSource = 'met'): NormalizedArtifact {
  n++;
  return {
    id: `${source}-${n}`, sourceId: String(n), source, title: 'Untitled', date: '',
    dateEarliest: null, dateLatest: null, period: null, culture: null, classification: null,
    objectType: null, medium: null, dimensions: null, artist: null, artistBio: null,
    description: null, primaryImage: 'x', primaryImageSmall: 'x', additionalImages: [],
    department: null, gallery: null, country: null, region: null, creditLine: null,
    sourceUrl: 'https://example.org', isPublicDomain: true, ...over,
  };
}

describe('parseQuery', () => {
  it('extracts dates, phrases and exclusions', () => {
    const q = parseQuery('"kettle hat" 15th century -replica');
    expect(q.phrases).toEqual(['kettle hat']);
    expect(q.excluded).toEqual(['replica']);
    expect(q.dateRange).toMatchObject({ startYear: 1401, endYear: 1500 });
    expect(q.text).toBe('"kettle hat"');
    expect(q.terms).toEqual(['kettle', 'hat']);
  });
  it('literal mode keeps the date as keywords', () => {
    const q = parseQuery('sword 1470', { literal: true });
    expect(q.dateRange).toBeNull();
    expect(q.text).toBe('sword 1470');
  });
  it('normalises plurals and spelling', () => {
    expect(parseQuery('Armours').terms).toEqual(['armor']);
    expect(normalizeTerm('sabres')).toBe('saber');
    expect(normalizeTerm('brooches')).toBe('brooch');
    expect(normalizeTerm('glass')).toBe('glass');
  });
  it('does not treat hyphenated words as exclusions', () => {
    expect(parseQuery('cup-hilt rapier').excluded).toEqual([]);
  });
});

describe('lexicon', () => {
  it('rewrites per dialect', () => {
    expect(toDialect('Plate armor and saber', 'uk')).toBe('Plate armour and sabre');
    expect(toDialect('grey armour', 'us')).toBe('gray armor');
  });
  it('offers related searches that keep the rest of the query', () => {
    const r = relatedSearches('viking sword');
    expect(r).toContain('viking longsword');
    expect(r.some((s) => s.endsWith(' sword') && s !== 'viking sword')).toBe(true);
    expect(relatedSearches('zzz')).toEqual([]);
  });
  it('suggests typo corrections', () => {
    expect(suggestCorrection('bascinett')).toBe('bascinet');
    expect(suggestCorrection('viking swrod')).toBe('viking sword');
    expect(suggestCorrection('viking sword')).toBeNull();
  });
});

describe('ranking', () => {
  it('token matching avoids short-word false positives', () => {
    expect(tokenMatch('sword', 'sword')).toBe(1);
    expect(tokenMatch('sword', 'broadsword')).toBe(0.7);
    expect(tokenMatch('bow', 'box')).toBe(0);
    expect(tokenMatch('mail', 'male')).toBe(0);
    expect(tokenMatch('arm', 'farm')).toBe(0);
    expect(tokenMatch('sallet', 'salet')).toBe(0.4);
  });

  it('puts on-topic titles first regardless of museum order', () => {
    const met = [
      art({ title: 'Portrait of a Man with a Sword', classification: 'Paintings' }),
      art({ title: 'Sword', objectType: 'Sword', classification: 'Swords' }),
    ];
    const va = [art({ title: 'Viking Sword', objectType: 'Sword', culture: 'Viking' }, 'va')];
    const ranked = rankArtifacts([met, va], parseQuery('viking sword'));
    expect(ranked[0].title).toBe('Viking Sword');
    expect(ranked[2].title).toBe('Portrait of a Man with a Sword');
  });

  it('matches across spelling variants and gives credit to related objects', () => {
    const list = [
      art({ title: 'Teapot' }),
      art({ title: 'Sallet', objectType: 'Sallet' }),
      art({ title: 'Armour for man', objectType: 'Armour' }, 'va'),
    ];
    expect(rankArtifacts([list], parseQuery('armor'), { noInterleave: true })[0].title).toBe('Armour for man');
    expect(rankArtifacts([list], parseQuery('helmet'), { noInterleave: true })[0].title).toBe('Sallet');
  });

  it('applies exclusions and de-duplicates', () => {
    const a = art({ title: 'Sallet' });
    const list = [a, a, art({ title: 'Sallet (replica)' })];
    const ranked = rankArtifacts([list], parseQuery('sallet -replica'));
    expect(ranked.map((r) => r.title)).toEqual(['Sallet']);
  });

  it('prefers pieces inside the date range', () => {
    const list = [
      art({ title: 'Sallet', dateEarliest: 1600, dateLatest: 1650 }),
      art({ title: 'Sallet', dateEarliest: 1460, dateLatest: 1480 }),
    ];
    const ranked = rankArtifacts([list], parseQuery('sallet'), {
      dateRange: { startYear: 1450, endYear: 1500 },
    });
    expect(ranked[0].dateEarliest).toBe(1460);
  });

  it('interleaves museums when scores are close', () => {
    const met = Array.from({ length: 6 }, () => art({ title: 'Sword', objectType: 'Sword' }));
    const va = Array.from({ length: 6 }, () => art({ title: 'Sword', objectType: 'Sword' }, 'va'));
    const top = rankArtifacts([met, va], parseQuery('sword')).slice(0, 6).map((a) => a.source);
    expect(top.filter((s) => s === 'va').length).toBeGreaterThanOrEqual(2);
    expect(top.filter((s) => s === 'met').length).toBeGreaterThanOrEqual(2);
  });

  it('sorts by date with undated last', () => {
    const list = [
      art({ title: 'Sword A', dateEarliest: 1500 }),
      art({ title: 'Sword B' }),
      art({ title: 'Sword C', dateEarliest: 900 }),
    ];
    expect(rankArtifacts([list], parseQuery('sword'), { sort: 'date-asc' }).map((a) => a.title)).toEqual(['Sword C', 'Sword A', 'Sword B']);
    expect(rankArtifacts([list], parseQuery('sword'), { sort: 'date-desc' }).map((a) => a.title)).toEqual(['Sword A', 'Sword C', 'Sword B']);
  });
});
