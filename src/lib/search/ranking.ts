import type { NormalizedArtifact } from '@/types/artifact';

/**
 * Score an artifact's relevance to the search query.
 * Higher score = more relevant.
 */
export function scoreArtifact(artifact: NormalizedArtifact, query: string): number {
  const q = query.toLowerCase().trim();
  const queryWords = q.split(/\s+/).filter((w) => w.length > 1);
  let score = 0;

  const title = (artifact.title || '').toLowerCase();
  const artist = (artifact.artist || '').toLowerCase();
  const culture = (artifact.culture || '').toLowerCase();
  const classification = (artifact.classification || '').toLowerCase();
  const medium = (artifact.medium || '').toLowerCase();
  const description = (artifact.description || '').toLowerCase();

  // Exact title match (full query in title)
  if (title.includes(q)) {
    score += 10;
  }

  // Per-word title matching
  for (const word of queryWords) {
    if (title.includes(word)) score += 5;
    if (artist.includes(word)) score += 3;
    if (culture.includes(word)) score += 3;
    if (classification.includes(word)) score += 2;
    if (medium.includes(word)) score += 2;
    if (description.includes(word)) score += 1;
  }

  // Bonus for having image
  if (artifact.primaryImage) score += 3;

  // Bonus for having date information
  if (artifact.dateEarliest !== null) score += 1;

  // Bonus for public domain
  if (artifact.isPublicDomain) score += 1;

  return score;
}

/**
 * Rank and sort artifacts by relevance to the query.
 * Interleaves results from different museums for variety.
 */
export function rankResults(
  artifacts: NormalizedArtifact[],
  query: string
): NormalizedArtifact[] {
  // Score all artifacts
  const scored = artifacts.map((a) => ({
    artifact: a,
    score: scoreArtifact(a, query),
  }));

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map((s) => s.artifact);
}
