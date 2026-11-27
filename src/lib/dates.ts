/**
 * Date parsing helpers.
 *
 * Museum records describe dates as free text ("ca. 1580", "late 15th century",
 * "1860s", "300–200 BC"). Reenactors type the same kind of expressions into the
 * search box. These helpers turn both into numeric year ranges (negative = BCE)
 * so results can be filtered and compared with a portrayal's date range.
 */

export interface YearRange {
  earliest: number;
  latest: number;
}

const DASH = '(?:-|–|—|to|until|through)';
const ERA = '(b\\.?\\s?c\\.?\\s?e?\\.?|a\\.?\\s?d\\.?|c\\.?\\s?e\\.?)';
const ORD = '(\\d{1,2})\\s?(?:st|nd|rd|th)';
const CENT = '(?:century|cent\\.?|c\\.)';
const PART = '(early|mid|middle|late|first half of the|second half of the|first half|second half)';

function isBce(era: string | undefined): boolean {
  return !!era && /^b/i.test(era.trim());
}

function centuryRange(n: number, bce: boolean, part?: string): YearRange {
  let earliest = bce ? -n * 100 : (n - 1) * 100 + 1;
  let latest = bce ? -(n - 1) * 100 - 1 : n * 100;
  const span = latest - earliest;
  const p = (part || '').toLowerCase();
  if (p.startsWith('early')) latest = earliest + Math.round(span / 3);
  else if (p.startsWith('mid')) {
    earliest += Math.round(span / 3);
    latest -= Math.round(span / 3);
  } else if (p.startsWith('late')) earliest = latest - Math.round(span / 3);
  else if (p.startsWith('first half')) latest = earliest + Math.round(span / 2);
  else if (p.startsWith('second half')) earliest = latest - Math.round(span / 2);
  return { earliest, latest };
}

function signed(year: number, era: string | undefined): number {
  return isBce(era) ? -year : year;
}

interface Match {
  range: YearRange;
  index: number;
  length: number;
}

/** Ordered list of matchers; the first that matches wins. */
function findDateExpression(text: string, strict: boolean): Match | null {
  let m: RegExpExecArray | null;

  // "15th–16th century", "3rd-2nd century BC"
  m = new RegExp(`\\b${ORD}\\s?${DASH}\\s?${ORD}\\s${CENT}(?:\\s?${ERA})?`, 'i').exec(text);
  if (m) {
    const bce = isBce(m[3]);
    const a = centuryRange(parseInt(m[1], 10), bce);
    const b = centuryRange(parseInt(m[2], 10), bce);
    return {
      range: { earliest: Math.min(a.earliest, b.earliest), latest: Math.max(a.latest, b.latest) },
      index: m.index,
      length: m[0].length,
    };
  }

  // "late 15th century", "15th c.", "2nd century BC"
  m = new RegExp(`\\b(?:${PART}\\s)?${ORD}\\s?${CENT}(?:\\s?${ERA})?`, 'i').exec(text);
  if (m) {
    return {
      range: centuryRange(parseInt(m[2], 10), isBce(m[3]), m[1]),
      index: m.index,
      length: m[0].length,
    };
  }

  // "1470s", "early 1800s"
  m = /\b(?:(early|mid|late)[\s-])?(\d{3,4})0s\b/i.exec(text);
  if (m) {
    const start = parseInt(m[2], 10) * 10;
    const isCentury = start % 100 === 0 && /00s$/i.test(m[0]);
    const span = isCentury ? 99 : 9;
    let earliest = start;
    let latest = start + span;
    const p = (m[1] || '').toLowerCase();
    if (p === 'early') latest = earliest + Math.round(span / 3);
    if (p === 'mid') {
      earliest += Math.round(span / 3);
      latest -= Math.round(span / 3);
    }
    if (p === 'late') earliest = latest - Math.round(span / 3);
    return { range: { earliest, latest }, index: m.index, length: m[0].length };
  }

  // "1450-1500", "1580–90", "300-200 BC", "100 BC – AD 100"
  m = new RegExp(
    `\\b(?:${ERA}\\s?)?(\\d{1,4})(?:\\s?${ERA})?\\s?${DASH}\\s?(?:${ERA}\\s?)?(\\d{1,4})(?:\\s?${ERA})?(?![\\d])`,
    'i'
  ).exec(text);
  if (m) {
    const eraA = m[1] || m[3];
    const eraB = m[4] || m[6];
    let a = parseInt(m[2], 10);
    let b = parseInt(m[5], 10);
    const anyEra = eraA || eraB;
    // "1580-90" → 1590
    if (!anyEra && m[5].length < m[2].length) {
      b = parseInt(m[2].slice(0, m[2].length - m[5].length) + m[5], 10);
    }
    const plausible = anyEra || (m[2].length >= 3 && a >= 100 && b <= 2100 && a <= b);
    if (plausible) {
      a = signed(a, eraA || (isBce(eraB) ? eraB : undefined));
      b = signed(b, eraB);
      return {
        range: { earliest: Math.min(a, b), latest: Math.max(a, b) },
        index: m.index,
        length: m[0].length,
      };
    }
  }

  // "200 BC", "AD 43", "43 CE"
  m = new RegExp(`\\b(\\d{1,4})\\s?${ERA}(?![a-z])`, 'i').exec(text);
  if (m) {
    const y = signed(parseInt(m[1], 10), m[2]);
    return { range: { earliest: y, latest: y }, index: m.index, length: m[0].length };
  }
  m = /\ba\.?\s?d\.?\s?(\d{1,4})\b/i.exec(text);
  if (m) {
    const y = parseInt(m[1], 10);
    return { range: { earliest: y, latest: y }, index: m.index, length: m[0].length };
  }

  // Plain year: "ca. 1580", "1796"
  m = /\b(?:(?:ca?\.?|circa|about|around)\s?)?(\d{4})\b/i.exec(text);
  if (m) {
    const y = parseInt(m[1], 10);
    if (y >= 1000 && y <= 2100) {
      if (strict) {
        // In a search query "pattern 1796", "model 1860", "M1911" are designations.
        const before = text.slice(0, m.index).trim().split(/\s+/).pop() || '';
        const after = text.slice(m.index + m[0].length).trim().split(/\s+/)[0] || '';
        if (/^(pattern|model|mod\.?|m|mk|mark|type|no\.?)$/i.test(before)) return null;
        if (/^(pattern|model)$/i.test(after)) return null;
      }
      return { range: { earliest: y, latest: y }, index: m.index, length: m[0].length };
    }
  }

  return null;
}

/** Parse a museum date string into a year range, or null when not understood. */
export function parseYearRange(text: string | null | undefined): YearRange | null {
  if (!text) return null;
  const first = findDateExpression(text, false);
  if (!first) return null;
  // "15th century to 17th century", "late 15th century - early 16th century":
  // a second date joined by "to" or a dash extends the range.
  const rest = text.slice(first.index + first.length);
  const joiner = /^\s*(?:to|until|[-–—])\s*/i.exec(rest);
  if (joiner) {
    const second = findDateExpression(rest.slice(joiner[0].length), false);
    if (second && second.index === 0) {
      return {
        earliest: Math.min(first.range.earliest, second.range.earliest),
        latest: Math.max(first.range.latest, second.range.latest),
      };
    }
  }
  return first.range;
}

export interface ExtractedDate {
  /** The query with the date expression removed. */
  text: string;
  range: YearRange;
  /** The expression as typed, e.g. "15th century". */
  matched: string;
}

/**
 * Pull a date expression out of a search query. A single year is widened
 * (±15 years) because "sallet 1470" means "around 1470", not "exactly 1470".
 * Returns null when there is no date or nothing else would remain to search.
 */
export function extractDateFromQuery(query: string): ExtractedDate | null {
  const found = findDateExpression(query, true);
  if (!found) return null;

  const matched = query.slice(found.index, found.index + found.length);
  const rest = (query.slice(0, found.index) + ' ' + query.slice(found.index + found.length))
    .replace(/\b(from|circa|ca?\.|dated|in|of|the)\s*$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!rest) return null;

  let { earliest, latest } = found.range;
  if (earliest === latest) {
    earliest -= 15;
    latest += 15;
  }
  return { text: rest, range: { earliest, latest }, matched: matched.trim() };
}

export function formatYear(year: number): string {
  return year < 0 ? `${-year} BCE` : `${year}`;
}

export function formatYearRange(start: number, end: number): string {
  if (start === end) return formatYear(start);
  if (start < 0 && end < 0) return `${-start}–${-end} BCE`;
  if (start < 0) return `${-start} BCE – ${end} CE`;
  return `${start}–${end}`;
}

export type DateFit = 'in-period' | 'near' | 'out' | 'undated';

/**
 * How well an artifact's date sits inside a target range. "near" is within
 * `tolerance` years of the range — close enough to be a plausible reference.
 */
export function dateFit(
  earliest: number | null,
  latest: number | null,
  start: number | null,
  end: number | null,
  tolerance = 25
): { fit: DateFit; gap: number } {
  if (start === null && end === null) return { fit: 'undated', gap: 0 };
  if (earliest === null && latest === null) return { fit: 'undated', gap: 0 };
  const a = earliest ?? latest!;
  const b = latest ?? earliest!;
  const s = start ?? -Infinity;
  const e = end ?? Infinity;
  if (b >= s && a <= e) return { fit: 'in-period', gap: 0 };
  const gap = b < s ? b - s : a - e; // negative = too early, positive = too late
  return { fit: Math.abs(gap) <= tolerance ? 'near' : 'out', gap };
}
