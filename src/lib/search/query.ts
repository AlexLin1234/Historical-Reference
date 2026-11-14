import { extractDateFromQuery, formatYearRange } from '@/lib/dates';
import { normalizeTerm } from './lexicon';

export interface ParsedQuery {
  /** Query as typed. */
  raw: string;
  /** Text to send to museums: date expression and exclusions removed. */
  text: string;
  /** Normalised terms used for ranking (stop words removed). */
  terms: string[];
  /** "Quoted phrases", lowercase. */
  phrases: string[];
  /** -excluded words, normalised. */
  excluded: string[];
  /** Date range found in the query text, if any. */
  dateRange: { startYear: number; endYear: number; label: string } | null;
}

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'in', 'on', 'for', 'with', 'from', 'to', 'by', 'at', 'or',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

/**
 * Understand a search query:
 *  - `"quoted phrases"` must appear together
 *  - `-word` excludes results mentioning the word (e.g. `sallet -replica`)
 *  - date expressions ("15th century", "1470s", "1450-1500", "ca. 1640") become
 *    a date filter instead of keywords, unless `literal` is set
 */
export function parseQuery(raw: string, options: { literal?: boolean } = {}): ParsedQuery {
  let working = raw.trim().replace(/[“”]/g, '"');

  const phrases: string[] = [];
  working.replace(/"([^"]+)"/g, (_, phrase: string) => {
    const clean = phrase.trim().toLowerCase();
    if (clean) phrases.push(clean);
    return '';
  });

  const excluded: string[] = [];
  working = working
    .replace(/(^|\s)-([A-Za-z][\w'-]*)/g, (_, lead: string, word: string) => {
      excluded.push(normalizeTerm(word));
      return lead;
    })
    .replace(/\s+/g, ' ')
    .trim();

  let dateRange: ParsedQuery['dateRange'] = null;
  if (!options.literal) {
    const extracted = extractDateFromQuery(working.replace(/"/g, ''));
    if (extracted && tokenize(extracted.text).some((t) => !STOP_WORDS.has(t))) {
      dateRange = {
        startYear: extracted.range.earliest,
        endYear: extracted.range.latest,
        label: formatYearRange(extracted.range.earliest, extracted.range.latest),
      };
      // Remove the expression from the working text (quotes are preserved).
      const idx = working.toLowerCase().indexOf(extracted.matched.toLowerCase());
      if (idx !== -1) {
        working = (working.slice(0, idx) + ' ' + working.slice(idx + extracted.matched.length))
          .replace(/\b(from|circa|ca?\.|dated|in|of|the)\s*$/i, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }
  }

  const terms = [...new Set(tokenize(working).filter((t) => !STOP_WORDS.has(t)).map(normalizeTerm))];

  return { raw, text: working || raw.trim(), terms, phrases, excluded, dateRange };
}
