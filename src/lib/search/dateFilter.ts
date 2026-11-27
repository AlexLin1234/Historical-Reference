import type { NormalizedArtifact } from '@/types/artifact';

/**
 * Whether a piece belongs in a date-filtered search: its date must overlap
 * the range, and its span must not dwarf it (a lot catalogued "1100–1980"
 * tells a Wars of the Roses search nothing). Undated pieces are excluded
 * unless the museum itself vouched for the date (`serverChecked`).
 */
export function withinRange(
  a: NormalizedArtifact,
  range: { startYear: number; endYear: number } | null,
  serverChecked = false
): boolean {
  if (!range) return true;
  if (a.dateEarliest === null && a.dateLatest === null) return serverChecked;
  const earliest = a.dateEarliest ?? a.dateLatest!;
  const latest = a.dateLatest ?? a.dateEarliest!;
  if (latest < range.startYear || earliest > range.endYear) return false;
  const maxSpan = Math.max(150, 2 * (range.endYear - range.startYear));
  return latest - earliest <= maxSpan;
}
