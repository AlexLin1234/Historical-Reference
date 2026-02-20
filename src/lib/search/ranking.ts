import type { NormalizedArtifact } from '@/types/artifact';

// ── Edit distance (Levenshtein) ──────────────────────────────────────────────

function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const row = Array.from({ length: n + 1 }, (_, j) => j);

  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = row[j];
      row[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, row[j - 1], row[j]);
      prev = tmp;
    }
  }
  return row[n];
}

// ── Field matching ───────────────────────────────────────────────────────────

const FIELD_WEIGHTS = {
  title: 5,
  artist: 3,
  culture: 3,
  classification: 2,
  medium: 2,
  description: 1,
} as const;

type FieldName = keyof typeof FIELD_WEIGHTS;

/**
 * Score how well a single query word matches within a text field.
 * Returns 0–1:  1.0 = exact word-boundary match
 *               0.7 = substring inside another word
 *               0.6 = prefix of a field token
 *               0.4 = within edit distance threshold (fuzzy / typo tolerance)
 *               0   = no match
 */
function wordMatchQuality(word: string, fieldText: string): number {
  if (!fieldText || !word) return 0;

  const idx = fieldText.indexOf(word);
  if (idx !== -1) {
    // Check for word-boundary match vs. substring match
    const before = idx === 0 || !/[a-z0-9]/.test(fieldText[idx - 1]);
    const after =
      idx + word.length >= fieldText.length ||
      !/[a-z0-9]/.test(fieldText[idx + word.length]);
    return before && after ? 1.0 : 0.7;
  }

  const tokens = fieldText.split(/[\s,;:.()\-/]+/).filter(Boolean);

  // Prefix match — a field token starts with the query word
  if (tokens.some((t) => t.startsWith(word))) return 0.6;

  // Fuzzy match — allow 1 edit for short words (≤4 chars), 2 for longer
  const maxDist = word.length <= 4 ? 1 : 2;
  for (const token of tokens) {
    if (Math.abs(token.length - word.length) > maxDist) continue;
    if (editDistance(word, token) <= maxDist) return 0.4;
  }

  return 0;
}

/**
 * Score an artifact's relevance to the search query.
 * Combines field-weighted matching, fuzzy/typo tolerance, and query coverage.
 */
export function scoreArtifact(artifact: NormalizedArtifact, query: string): number {
  const q = query.toLowerCase().trim();
  const queryWords = q.split(/\s+/).filter((w) => w.length > 1);
  if (queryWords.length === 0) return 0;

  const fields: Record<FieldName, string> = {
    title: (artifact.title || '').toLowerCase(),
    artist: (artifact.artist || '').toLowerCase(),
    culture: (artifact.culture || '').toLowerCase(),
    classification: (artifact.classification || '').toLowerCase(),
    medium: (artifact.medium || '').toLowerCase(),
    description: (artifact.description || '').toLowerCase(),
  };

  let score = 0;

  // Full query appears in title — strong relevance signal
  if (fields.title.includes(q)) {
    score += 10;
  }

  // Per-word, per-field scoring weighted by match quality
  let wordsMatched = 0;
  for (const word of queryWords) {
    let bestWordScore = 0;
    for (const [field, weight] of Object.entries(FIELD_WEIGHTS) as [FieldName, number][]) {
      const quality = wordMatchQuality(word, fields[field]);
      const wordScore = quality * weight;
      bestWordScore = Math.max(bestWordScore, wordScore);
      score += wordScore;
    }
    if (bestWordScore > 0) wordsMatched++;
  }

  // Query coverage bonus — artifacts matching ALL query words rank higher
  const coverage = wordsMatched / queryWords.length;
  score *= 0.5 + 0.5 * coverage;

  // Metadata bonuses
  if (artifact.primaryImage) score += 3;
  if (artifact.dateEarliest !== null) score += 1;
  if (artifact.isPublicDomain) score += 1;

  return score;
}

/**
 * Rank and sort artifacts by relevance to the query.
 */
export function rankResults(
  artifacts: NormalizedArtifact[],
  query: string
): NormalizedArtifact[] {
  const scored = artifacts.map((a) => ({
    artifact: a,
    score: scoreArtifact(a, query),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.artifact);
}
