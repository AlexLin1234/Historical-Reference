import type { NormalizedArtifact } from '@/types/artifact';
import type { Impression, SavedArtifact } from '@/types/collection';
import { MUSEUM_CITATIONS, MUSEUM_LABELS } from '@/lib/constants';
import { dateFit, formatYearRange } from '@/lib/dates';
import { guessKitSlot, KIT_SLOTS, type KitSlot } from '@/lib/search/categories';

function sentence(text: string | null | undefined): string | null {
  const t = (text || '').replace(/\s+/g, ' ').trim().replace(/[.;,]+$/, '');
  return t ? t : null;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export function formatAccessDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * A museum-object citation in the form authenticity officers and event
 * organisers expect: what it is, when and where it was made, where it is
 * held and under which number, and where it was consulted.
 */
export function buildCitation(artifact: NormalizedArtifact, accessed: Date = new Date()): string {
  const holder =
    artifact.holder ??
    MUSEUM_CITATIONS[artifact.source] ??
    (artifact.source === 'scraped' ? hostOf(artifact.sourceUrl) : MUSEUM_LABELS[artifact.source]);

  const parts = [
    [sentence(artifact.title), sentence(artifact.date)].filter(Boolean).join(', '),
    sentence(artifact.artist) ?? sentence(artifact.culture),
    sentence(artifact.medium),
    [holder, artifact.accessionNumber ? `acc. no. ${artifact.accessionNumber}` : null]
      .filter(Boolean)
      .join(', '),
  ].filter(Boolean);

  return `${parts.join('. ')}. ${artifact.sourceUrl} (accessed ${formatAccessDate(accessed)}).`;
}

export function slotOf(artifact: SavedArtifact): KitSlot {
  return KIT_SLOTS.includes(artifact.kitSlot as KitSlot)
    ? (artifact.kitSlot as KitSlot)
    : guessKitSlot(artifact);
}

export function describeFit(artifact: NormalizedArtifact, impression: Impression): {
  fit: ReturnType<typeof dateFit>['fit'];
  label: string;
} {
  const { fit, gap } = dateFit(
    artifact.dateEarliest,
    artifact.dateLatest,
    impression.startYear,
    impression.endYear
  );
  if (fit === 'in-period') return { fit, label: 'In period' };
  if (fit === 'undated') {
    return {
      fit,
      label: impression.startYear === null && impression.endYear === null ? 'No target dates' : 'Undated',
    };
  }
  const years = Math.abs(gap);
  return { fit, label: `${years} yr${years === 1 ? '' : 's'} ${gap < 0 ? 'too early' : 'too late'}` };
}

export function impressionDates(impression: Impression): string | null {
  if (impression.startYear === null && impression.endYear === null) return null;
  return formatYearRange(impression.startYear ?? impression.endYear!, impression.endYear ?? impression.startYear!);
}

/** Group an impression's artifacts by kit slot, in kit order. */
export function groupBySlot(artifacts: SavedArtifact[]): [KitSlot, SavedArtifact[]][] {
  const groups = new Map<KitSlot, SavedArtifact[]>();
  for (const a of artifacts) {
    const slot = slotOf(a);
    groups.set(slot, [...(groups.get(slot) ?? []), a]);
  }
  return KIT_SLOTS.filter((s) => groups.has(s)).map((s) => [s, groups.get(s)!]);
}

/** Plain-text / Markdown documentation sheet for an impression. */
export function impressionToMarkdown(
  impression: Impression,
  artifacts: SavedArtifact[],
  accessed: Date = new Date()
): string {
  const lines: string[] = [`# ${impression.name}`, ''];
  const dates = impressionDates(impression);
  if (dates) lines.push(`**Portrayal dates:** ${dates}`, '');
  if (impression.description.trim()) lines.push(impression.description.trim(), '');
  lines.push(`_Kit documentation — ${artifacts.length} museum reference${artifacts.length === 1 ? '' : 's'}, compiled ${formatAccessDate(accessed)}._`, '');

  for (const [slot, items] of groupBySlot(artifacts)) {
    lines.push(`## ${slot}`, '');
    items.forEach((a, i) => {
      const fit = describeFit(a, impression);
      lines.push(`${i + 1}. ${buildCitation(a, accessed)}`);
      if (fit.fit !== 'undated') lines.push(`   - Date check: ${fit.label}`);
      if (a.dimensions) lines.push(`   - Dimensions: ${a.dimensions.replace(/\s+/g, ' ').trim()}`);
      if (a.notes.trim()) lines.push(`   - Notes: ${a.notes.trim().replace(/\n+/g, ' ')}`);
    });
    lines.push('');
  }
  return lines.join('\n');
}
