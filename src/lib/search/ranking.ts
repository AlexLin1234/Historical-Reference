import type { NormalizedArtifact, SortOrder } from '@/types/artifact';
import type { ParsedQuery } from './query';
import { tokenize } from './query';
import { editDistance, normalizeTerm, relatedTerms } from './lexicon';

/**
 * Cross-museum relevance ranking.
 *
 * Every museum returns its own page of results in its own order. To present
 * one list we score each artifact against the query with a BM25F-style model
 * (field weights, term-frequency saturation, IDF computed over the candidate
 * set), then blend in:
 *   - the museum's own ordering (it saw the full record, we only see a summary)
 *   - optional semantic similarity from the vector index
 *   - how well the artifact's date sits in the requested range
 *   - record quality (image, dated)
 * and finally interleave museums so one large collection cannot crowd out the
 * rest of the first screen.
 */

const FIELD_WEIGHTS = {
  title: 4,
  objectType: 3.5,
  classification: 2.5,
  culture: 2,
  period: 1.5,
  medium: 1.5,
  artist: 1.2,
  department: 1,
  country: 1,
  description: 1,
} as const;

type FieldName = keyof typeof FIELD_WEIGHTS;
const FIELDS = Object.keys(FIELD_WEIGHTS) as FieldName[];

const K1 = 1.2;

interface Doc {
  artifact: NormalizedArtifact;
  tokens: Record<FieldName, string[]>;
  all: Set<string>;
  text: string;
}

function buildDoc(artifact: NormalizedArtifact): Doc {
  const tokens = {} as Record<FieldName, string[]>;
  const all = new Set<string>();
  const parts: string[] = [];
  for (const field of FIELDS) {
    const value = artifact[field];
    const raw = typeof value === 'string' ? value : '';
    parts.push(raw.toLowerCase());
    const list = tokenize(raw).map(normalizeTerm);
    tokens[field] = list;
    for (const t of list) all.add(t);
  }
  return { artifact, tokens, all, text: parts.join(' \n ') };
}

/**
 * How well a query term matches a single document token (0–1).
 *   1.0  same word (after plural / spelling normalisation)
 *   0.7  compound containing the term ("broadsword" for "sword")
 *   0.6  token starts with the term ("embroider" → "embroidered")
 *   0.4  typo-distance match (only for words long enough to be unambiguous)
 */
export function tokenMatch(term: string, token: string): number {
  if (term === token) return 1;
  if (term.length >= 4 && token.length > term.length) {
    if (token.endsWith(term)) return 0.7;
    if (token.startsWith(term)) return 0.6;
  }
  if (term.length >= 5 && token.length >= 5) {
    const max = term.length >= 9 ? 2 : 1;
    if (editDistance(term, token, max) <= max) return 0.4;
  }
  return 0;
}

/** Best match quality and effective term frequency of `term` in a token list. */
function fieldMatch(term: string, tokens: string[]): { quality: number; tf: number } {
  let quality = 0;
  let tf = 0;
  for (const token of tokens) {
    const q = tokenMatch(term, token);
    if (q > 0) {
      tf += q;
      if (q > quality) quality = q;
    }
  }
  return { quality, tf };
}

function containsPhrase(tokens: string[], phrase: string[]): boolean {
  if (phrase.length === 0) return false;
  outer: for (let i = 0; i + phrase.length <= tokens.length; i++) {
    for (let j = 0; j < phrase.length; j++) {
      if (tokens[i + j] !== phrase[j]) continue outer;
    }
    return true;
  }
  return false;
}

export interface RankOptions {
  /** Active date range (from the filter or extracted from the query). */
  dateRange?: { startYear: number; endYear: number } | null;
  /** artifact id → cosine similarity from the vector index. */
  semantic?: Map<string, number>;
  sort?: SortOrder;
  /** Skip the museum interleave (used by tests). */
  noInterleave?: boolean;
}

export interface ScoredArtifact {
  artifact: NormalizedArtifact;
  score: number;
  text: number;
}

/**
 * Score artifacts. `groups` keeps each museum's results in the museum's own
 * order so that order can be used as a prior.
 */
export function scoreArtifacts(
  groups: NormalizedArtifact[][],
  query: ParsedQuery,
  options: RankOptions = {}
): ScoredArtifact[] {
  const seen = new Set<string>();
  const docs: { doc: Doc; position: number }[] = [];
  for (const group of groups) {
    let position = 0;
    for (const artifact of group) {
      if (seen.has(artifact.id)) continue;
      seen.add(artifact.id);
      docs.push({ doc: buildDoc(artifact), position: position++ });
    }
  }

  // Exclusions: drop anything that visibly mentions an excluded word.
  const kept = docs.filter(
    ({ doc }) => !query.excluded.some((ex) => doc.all.has(ex))
  );
  const N = kept.length;
  if (N === 0) return [];

  // Document frequency of each query term across the candidate set.
  const idf = new Map<string, number>();
  for (const term of query.terms) {
    let df = 0;
    for (const { doc } of kept) {
      for (const token of doc.all) {
        if (tokenMatch(term, token) >= 0.6) {
          df++;
          break;
        }
      }
    }
    // Floor keeps very common terms (the object name itself) meaningful.
    idf.set(term, Math.max(0.35, Math.log(1 + (N - df + 0.5) / (df + 0.5))));
  }

  const related = new Map<string, string[][]>();
  for (const term of query.terms) {
    related.set(
      term,
      relatedTerms(term).map((r) => tokenize(r).map(normalizeTerm))
    );
  }
  const phraseTokens = query.phrases.map((p) => tokenize(p).map(normalizeTerm));

  const scored = kept.map(({ doc, position }) => {
    let text = 0;
    let matched = 0;

    for (const term of query.terms) {
      let termScore = 0;
      let best = 0;
      for (const field of FIELDS) {
        const { quality, tf } = fieldMatch(term, doc.tokens[field]);
        if (quality === 0) continue;
        best = Math.max(best, quality);
        termScore += FIELD_WEIGHTS[field] * quality * ((tf * (K1 + 1)) / (tf + K1));
      }
      if (best === 0) {
        // Weak credit when the record names a relative of the term
        // (a "sallet" is still a decent answer to "helmet").
        const rel = related.get(term) ?? [];
        const hit = rel.some((r) =>
          FIELDS.some((f) => f !== 'description' && containsPhrase(doc.tokens[f], r))
        );
        if (hit) {
          termScore = 0.35 * FIELD_WEIGHTS.objectType;
          best = 0.35;
        }
      }
      if (best > 0) matched += Math.min(1, best + 0.3);
      text += termScore * (idf.get(term) ?? 1);
    }

    if (query.terms.length > 0) {
      const coverage = matched / query.terms.length;
      text *= 0.35 + 0.65 * coverage * coverage;

      // Terms adjacent and in order in the title: the record is *about* this.
      if (query.terms.length > 1 && containsPhrase(doc.tokens.title, query.terms)) {
        text *= 1.5;
      } else if (
        query.terms.length > 1 &&
        query.terms.every((t) => doc.tokens.title.includes(t))
      ) {
        text *= 1.2;
      }
      // Short, on-topic titles ("Sallet") beat long ones that merely mention it.
      const titleLen = doc.tokens.title.length;
      if (titleLen > 0 && query.terms.some((t) => doc.tokens.title.includes(t))) {
        text *= 1 + 0.25 / Math.sqrt(titleLen);
      }
    }

    // Quoted phrases: we only see a summary of the record, so a missing phrase
    // is a strong demotion rather than removal.
    for (const phrase of phraseTokens) {
      const found = FIELDS.some((f) => containsPhrase(doc.tokens[f], phrase));
      text *= found ? 1.4 : 0.25;
    }

    return { doc, position, text };
  });

  const maxText = Math.max(...scored.map((s) => s.text), 1e-9);
  const semantic = options.semantic;
  const range = options.dateRange;

  return scored.map(({ doc, position, text }) => {
    const a = doc.artifact;
    const textNorm = text / maxText;
    const sourcePrior = 1 / (1 + position / 6);

    let score = 0.68 * textNorm + 0.32 * sourcePrior;

    if (semantic && semantic.size > 0) {
      const sim = semantic.get(a.id);
      // gte-small similarities for related text sit roughly in 0.75–0.95.
      if (sim !== undefined) score += 0.25 * Math.max(0, Math.min(1, (sim - 0.75) / 0.2));
    }

    if (range && (a.dateEarliest !== null || a.dateLatest !== null)) {
      const lo = a.dateEarliest ?? a.dateLatest!;
      const hi = a.dateLatest ?? a.dateEarliest!;
      const overlap = Math.min(hi, range.endYear) - Math.max(lo, range.startYear);
      const span = Math.max(1, hi - lo);
      if (overlap >= 0) {
        // Tightly dated pieces wholly inside the range are the best references.
        score *= 1.05 + 0.15 * Math.min(1, (overlap + 1) / (span + 1));
      } else {
        score *= 0.5;
      }
    }

    let quality = 1;
    if (a.primaryImage || a.primaryImageSmall) quality += 0.06;
    if (a.dateEarliest !== null || a.dateLatest !== null || a.date) quality += 0.03;
    if (a.medium) quality += 0.01;
    score *= quality;

    return { artifact: a, score, text: textNorm };
  });
}

/**
 * Order by score while keeping museums mixed: an item from a museum that
 * already appears among the previous few picks is discounted slightly.
 */
function interleave(scored: ScoredArtifact[]): ScoredArtifact[] {
  const pool = [...scored].sort((a, b) => b.score - a.score);
  const out: ScoredArtifact[] = [];
  const WINDOW = 4;
  const PENALTY = 0.88;

  while (pool.length > 0) {
    const recent = out.slice(-WINDOW).map((s) => s.artifact.source);
    let bestIdx = 0;
    let bestScore = -Infinity;
    // Only the head of the pool can win; bound the scan for large sets.
    const scan = Math.min(pool.length, 24);
    for (let i = 0; i < scan; i++) {
      const repeats = recent.filter((s) => s === pool[i].artifact.source).length;
      const adjusted = pool[i].score * Math.pow(PENALTY, repeats);
      if (adjusted > bestScore) {
        bestScore = adjusted;
        bestIdx = i;
      }
    }
    out.push(pool.splice(bestIdx, 1)[0]);
  }
  return out;
}

function dateKey(a: NormalizedArtifact): number | null {
  return a.dateEarliest ?? a.dateLatest ?? null;
}

export function rankArtifacts(
  groups: NormalizedArtifact[][],
  query: ParsedQuery,
  options: RankOptions = {}
): NormalizedArtifact[] {
  const scored = scoreArtifacts(groups, query, options);
  const sort = options.sort ?? 'relevance';

  if (sort === 'date-asc' || sort === 'date-desc') {
    const dir = sort === 'date-asc' ? 1 : -1;
    return [...scored]
      .sort((x, y) => {
        const dx = dateKey(x.artifact);
        const dy = dateKey(y.artifact);
        if (dx === null && dy === null) return y.score - x.score;
        if (dx === null) return 1; // undated last, whichever direction
        if (dy === null) return -1;
        return dx === dy ? y.score - x.score : (dx - dy) * dir;
      })
      .map((s) => s.artifact);
  }

  if (sort === 'title') {
    return [...scored]
      .sort((x, y) => x.artifact.title.localeCompare(y.artifact.title))
      .map((s) => s.artifact);
  }

  const ordered = options.noInterleave
    ? [...scored].sort((a, b) => b.score - a.score)
    : interleave(scored);
  return ordered.map((s) => s.artifact);
}
