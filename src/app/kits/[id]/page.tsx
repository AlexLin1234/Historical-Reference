'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Check, Copy, Download, Pencil, Printer, Search, Trash2, X } from 'lucide-react';
import type { SavedArtifact } from '@/types/collection';
import { useCollection } from '@/hooks/useCollection';
import { useCopy } from '@/hooks/useCopy';
import {
  deleteImpression,
  setArtifactInImpression,
  updateImpression,
  updateSavedArtifact,
} from '@/lib/storage';
import {
  buildCitation,
  describeFit,
  groupBySlot,
  impressionDates,
  impressionToMarkdown,
  slotOf,
} from '@/lib/citation';
import { KIT_SLOTS } from '@/lib/search/categories';
import { searchHref } from '@/lib/search/url';
import { periodFor } from '@/lib/search/url';
import { SEARCH_SOURCE_IDS } from '@/lib/constants';
import { ImpressionForm } from '@/components/kits/ImpressionForm';
import { FitBadge } from '@/components/kits/FitBadge';
import { ArtifactImage } from '@/components/artifact/ArtifactImage';
import { artifactHref } from '@/components/artifact/ArtifactCard';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import type { Impression } from '@/types/collection';

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg border border-black/20 px-3 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5';

/** Kit areas that should normally be evidenced; used for the gaps list. */
const CORE_SLOTS = [
  { slot: 'Headwear & helmets', query: 'hat' },
  { slot: 'Clothing', query: 'clothing' },
  { slot: 'Footwear & legwear', query: 'shoe' },
  { slot: 'Belts, bags & accessories', query: 'belt' },
] as const;

function periodSearchHref(imp: Impression, query: string): string {
  return searchHref({
    query,
    timePeriod:
      imp.startYear !== null && imp.endYear !== null ? periodFor(imp.startYear, imp.endYear) : null,
    category: null,
    sources: SEARCH_SOURCE_IDS,
    hasImage: true,
  });
}

function KitEntry({ artifact, impression }: { artifact: SavedArtifact; impression: Impression }) {
  const fit = describeFit(artifact, impression);
  return (
    <li className="flex gap-4 break-inside-avoid rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink print:border-black/30 print:p-2">
      <Link
        href={artifactHref(artifact)}
        className="h-24 w-24 shrink-0 overflow-hidden rounded bg-steel/10 print:h-20 print:w-20"
      >
        <ArtifactImage src={artifact.primaryImageSmall || artifact.primaryImage} alt={artifact.title} />
      </Link>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link href={artifactHref(artifact)} className="font-semibold hover:underline">
              {artifact.title}
            </Link>
            <p className="text-sm text-steel dark:text-steel-light">
              {[artifact.date, artifact.culture || artifact.artist].filter(Boolean).join(' · ') || 'Undated'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FitBadge fit={fit.fit} label={fit.label} />
            <button
              type="button"
              onClick={() => setArtifactInImpression(impression.id, artifact.id, false)}
              aria-label={`Remove ${artifact.title} from this impression`}
              className="rounded p-1 text-steel hover:bg-black/5 hover:text-red-600 dark:text-steel-light dark:hover:bg-white/10 print:hidden"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <p className="break-words text-xs leading-relaxed text-steel dark:text-steel-light">
          {buildCitation(artifact)}
        </p>
        {artifact.dimensions && (
          <p className="text-xs text-steel dark:text-steel-light">
            <span className="font-medium">Dimensions:</span> {artifact.dimensions}
          </p>
        )}

        {/* Screen: editable. Print: plain text, only when there is something to show. */}
        <div className="grid gap-2 sm:grid-cols-[1fr_auto] print:hidden">
          <textarea
            key={artifact.id}
            defaultValue={artifact.notes}
            onBlur={(e) => {
              if (e.target.value !== artifact.notes) updateSavedArtifact(artifact.id, { notes: e.target.value });
            }}
            rows={2}
            maxLength={4000}
            aria-label={`Notes on ${artifact.title}`}
            placeholder="Notes: what this piece evidences in your kit…"
            className="w-full rounded border border-black/20 bg-white px-2 py-1.5 text-sm outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink"
          />
          <select
            value={slotOf(artifact)}
            onChange={(e) => updateSavedArtifact(artifact.id, { kitSlot: e.target.value })}
            aria-label={`Kit area for ${artifact.title}`}
            className="h-fit rounded border border-black/20 bg-white px-2 py-1.5 text-sm dark:border-white/20 dark:bg-ink"
          >
            {KIT_SLOTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {artifact.notes.trim() && (
          <p className="hidden whitespace-pre-line text-xs print:block">
            <span className="font-medium">Notes:</span> {artifact.notes}
          </p>
        )}
      </div>
    </li>
  );
}

export default function ImpressionPage() {
  const params = useParams();
  const router = useRouter();
  const { collection } = useCollection();
  const { copied, copy } = useCopy();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const impression = collection.impressions.find((i) => i.id === params.id);

  const back = (
    <Link
      href="/kits"
      className="mb-6 inline-flex items-center gap-2 text-steel hover:text-ink dark:text-steel-light dark:hover:text-parchment print:hidden"
    >
      <ArrowLeft size={20} />
      All impressions
    </Link>
  );

  if (!impression) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        {back}
        {/* updatedAt is empty until the browser's saved data has been read. */}
        {collection.updatedAt !== '' && (
          <ErrorMessage message="This impression does not exist in this browser. Impressions are stored locally; import an export to move them between devices." />
        )}
      </div>
    );
  }

  const byId = new Map(collection.artifacts.map((a) => [a.id, a]));
  const items = impression.artifactIds.map((id) => byId.get(id)).filter((a) => a !== undefined);
  const groups = groupBySlot(items);
  const available = collection.artifacts.filter((a) => !impression.artifactIds.includes(a.id));
  const dates = impressionDates(impression);
  const fits = items.map((a) => describeFit(a, impression).fit);
  const count = (f: string) => fits.filter((x) => x === f).length;
  const covered = new Set(groups.map(([slot]) => slot));
  const gaps = CORE_SLOTS.filter((c) => !covered.has(c.slot));
  const markdown = () => impressionToMarkdown(impression, items);

  const download = () => {
    const blob = new Blob([markdown()], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${impression.name.replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase() || 'impression'}-documentation.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 print:max-w-none print:p-0">
      {back}

      {editing ? (
        <div className="mb-8 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink">
          <ImpressionForm
            initial={impression}
            submitLabel="Save changes"
            onCancel={() => setEditing(false)}
            onSubmit={(draft) => {
              updateImpression(impression.id, draft);
              setEditing(false);
            }}
          />
        </div>
      ) : (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">{impression.name}</h1>
            <p className="mt-1 text-steel dark:text-steel-light">
              {dates ? `Portrayal dates: ${dates}` : 'No target dates set'}
            </p>
            {impression.description && (
              <p className="mt-2 max-w-2xl whitespace-pre-line">{impression.description}</p>
            )}
            <p className="mt-2 hidden text-xs print:block">
              Kit documentation sheet · {items.length} museum reference{items.length === 1 ? '' : 's'} · printed{' '}
              {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={() => setEditing(true)} className={buttonClass}>
              <Pencil size={15} />
              Edit
            </button>
            <button onClick={() => window.print()} disabled={items.length === 0} className={`${buttonClass} disabled:opacity-50`}>
              <Printer size={15} />
              Print sheet
            </button>
            <button onClick={() => copy(markdown())} disabled={items.length === 0} className={`${buttonClass} disabled:opacity-50`}>
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? 'Copied' : 'Copy as text'}
            </button>
            <button onClick={download} disabled={items.length === 0} className={`${buttonClass} disabled:opacity-50`}>
              <Download size={15} />
              Markdown
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Delete the impression "${impression.name}"? Your saved artifacts are kept.`)) {
                  deleteImpression(impression.id);
                  router.push('/kits');
                }
              }}
              className={`${buttonClass} border-red-300 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30`}
            >
              <Trash2 size={15} />
              Delete
            </button>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-sm print:hidden">
          <span className="text-steel dark:text-steel-light">Date check:</span>
          {count('in-period') > 0 && <FitBadge fit="in-period" label={`${count('in-period')} in period`} />}
          {count('near') > 0 && <FitBadge fit="near" label={`${count('near')} within 25 years`} />}
          {count('out') > 0 && <FitBadge fit="out" label={`${count('out')} out of period`} />}
          {count('undated') > 0 && <FitBadge fit="undated" label={`${count('undated')} undated`} />}
        </div>
      )}

      {gaps.length > 0 && (
        <div className="mb-6 rounded-lg border border-brass/30 bg-brass/5 px-4 py-3 text-sm print:hidden">
          <p className="mb-2 font-medium">Not yet evidenced</p>
          <div className="flex flex-wrap gap-2">
            {gaps.map((g) => (
              <Link
                key={g.slot}
                href={periodSearchHref(impression, g.query)}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/15 px-3 py-1 transition-colors hover:border-brass hover:text-brass dark:border-white/20 dark:hover:border-brass-light dark:hover:text-brass-light"
              >
                <Search size={13} aria-hidden />
                {g.slot}
                {dates ? ` · ${dates}` : ''}
              </Link>
            ))}
          </div>
        </div>
      )}

      {groups.map(([slot, list]) => (
        <section key={slot} className="mb-8">
          <h2 className="mb-3 text-xl font-semibold">
            {slot} <span className="text-base font-normal text-steel dark:text-steel-light">({list.length})</span>
          </h2>
          <ul className="space-y-3">
            {list.map((a) => (
              <KitEntry key={a.id} artifact={a} impression={impression} />
            ))}
          </ul>
        </section>
      ))}

      <section className="rounded-lg border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-ink print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Add references</h2>
            <p className="text-sm text-steel dark:text-steel-light">
              {available.length > 0
                ? `${available.length} saved artifact${available.length === 1 ? '' : 's'} not yet in this impression.`
                : 'Everything in your collection is already here. Search and save more pieces to add them.'}
            </p>
          </div>
          <div className="flex gap-2">
            {available.length > 0 && (
              <button onClick={() => setAdding(!adding)} className={buttonClass} aria-expanded={adding}>
                {adding ? 'Done' : 'Add from collection'}
              </button>
            )}
            <Link href={periodSearchHref(impression, '')} className={buttonClass}>
              <Search size={15} />
              Search museums
            </Link>
          </div>
        </div>

        {adding && available.length > 0 && (
          <ul className="mt-4 divide-y divide-black/10 dark:divide-white/10">
            {available.map((a) => {
              const fit = describeFit(a, impression);
              return (
                <li key={a.id} className="flex items-center gap-3 py-2">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-steel/10">
                    <ArtifactImage src={a.primaryImageSmall || a.primaryImage} alt="" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    <p className="truncate text-xs text-steel dark:text-steel-light">{a.date || 'Undated'}</p>
                  </div>
                  <FitBadge fit={fit.fit} label={fit.label} />
                  <button
                    onClick={() => setArtifactInImpression(impression.id, a.id, true)}
                    className="rounded border border-brass px-2.5 py-1 text-sm font-medium text-brass hover:bg-brass hover:text-white dark:border-brass-light dark:text-brass-light"
                    aria-label={`Add ${a.title}`}
                  >
                    Add
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
