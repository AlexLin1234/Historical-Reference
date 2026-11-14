import { describe, expect, it } from 'vitest';
import { dateFit, extractDateFromQuery, formatYearRange, parseYearRange } from '@/lib/dates';

describe('parseYearRange', () => {
  const cases: [string, [number, number] | null][] = [
    ['ca. 1580', [1580, 1580]],
    ['1580–1600', [1580, 1600]],
    ['1580-90', [1580, 1590]],
    ['1860s', [1860, 1869]],
    ['1800s', [1800, 1899]],
    ['15th century', [1401, 1500]],
    ['late 15th century', [1467, 1500]],
    ['early 15th century', [1401, 1434]],
    ['15th–16th century', [1401, 1600]],
    ['3rd century BC', [-300, -201]],
    ['300–200 BC', [-300, -200]],
    ['100 BC – AD 100', [-100, 100]],
    ['AD 43', [43, 43]],
    ['200 BCE', [-200, -200]],
    ['made in London, 1796', [1796, 1796]],
    ['undated', null],
    ['', null],
  ];
  for (const [input, expected] of cases) {
    it(input || '(empty)', () => {
      const got = parseYearRange(input);
      expect(got ? [got.earliest, got.latest] : null).toEqual(expected);
    });
  }
});

describe('extractDateFromQuery', () => {
  it('pulls a century out of the query', () => {
    const r = extractDateFromQuery('15th century sallet')!;
    expect(r.text).toBe('sallet');
    expect(r.range).toEqual({ earliest: 1401, latest: 1500 });
  });
  it('widens a single year', () => {
    const r = extractDateFromQuery('sallet 1470')!;
    expect(r.text).toBe('sallet');
    expect(r.range).toEqual({ earliest: 1455, latest: 1485 });
  });
  it('handles decades and ranges', () => {
    expect(extractDateFromQuery('frock coat 1860s')!.range).toEqual({ earliest: 1860, latest: 1869 });
    expect(extractDateFromQuery('helmet 1450-1500')!.range).toEqual({ earliest: 1450, latest: 1500 });
    expect(extractDateFromQuery('brooch from 900')).toBeNull();
    expect(extractDateFromQuery('roman brooch AD 100')!.range).toEqual({ earliest: 85, latest: 115 });
  });
  it('leaves pattern/model designations alone', () => {
    expect(extractDateFromQuery('pattern 1796 light cavalry sabre')).toBeNull();
    expect(extractDateFromQuery('model 1860 army revolver')).toBeNull();
    expect(extractDateFromQuery('1853 pattern enfield')).toBeNull();
  });
  it('needs something left to search for', () => {
    expect(extractDateFromQuery('15th century')).toBeNull();
    expect(extractDateFromQuery('viking sword')).toBeNull();
  });
});

describe('dateFit', () => {
  it('classifies', () => {
    expect(dateFit(1470, 1480, 1455, 1487).fit).toBe('in-period');
    expect(dateFit(1430, 1440, 1455, 1487)).toEqual({ fit: 'near', gap: -15 });
    expect(dateFit(1550, 1560, 1455, 1487)).toEqual({ fit: 'out', gap: 63 });
    expect(dateFit(null, null, 1455, 1487).fit).toBe('undated');
  });
  it('formats', () => {
    expect(formatYearRange(-300, -200)).toBe('300–200 BCE');
    expect(formatYearRange(-100, 100)).toBe('100 BCE – 100 CE');
    expect(formatYearRange(1455, 1487)).toBe('1455–1487');
  });
});
