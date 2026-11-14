'use client';

import Link from 'next/link';
import { Shirt } from 'lucide-react';
import type { NormalizedArtifact } from '@/types/artifact';
import { useCollection } from '@/hooks/useCollection';
import { saveArtifact, setArtifactInImpression, updateSavedArtifact } from '@/lib/storage';
import { describeFit, impressionDates } from '@/lib/citation';
import { FitBadge } from '@/components/kits/FitBadge';

/**
 * On an artifact page: research notes plus which impressions (kits) the piece
 * documents, with an immediate check of its date against each impression.
 */
export function KitPanel({ artifact }: { artifact: NormalizedArtifact }) {
  const { collection } = useCollection();
  const saved = collection.artifacts.find((a) => a.id === artifact.id);

  return (
    <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink print:hidden">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <Shirt size={18} className="text-brass dark:text-brass-light" aria-hidden />
        Use in my kit
      </h2>

      {collection.impressions.length === 0 ? (
        <p className="text-sm text-steel dark:text-steel-light">
          Group the pieces that document a portrayal into an{' '}
          <Link href="/kits" className="text-brass underline-offset-2 hover:underline dark:text-brass-light">
            impression
          </Link>{' '}
          to check their dates and print a documentation sheet.
        </p>
      ) : (
        <ul className="space-y-2">
          {collection.impressions.map((imp) => {
            const included = imp.artifactIds.includes(artifact.id);
            const fit = describeFit(artifact, imp);
            return (
              <li key={imp.id} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={included}
                    onChange={(e) => {
                      // Adding to a kit implies keeping the piece.
                      if (e.target.checked && !saved) saveArtifact(artifact);
                      setArtifactInImpression(imp.id, artifact.id, e.target.checked);
                    }}
                    className="h-4 w-4 accent-brass"
                  />
                  <span className="font-medium">{imp.name}</span>
                  {impressionDates(imp) && (
                    <span className="text-steel dark:text-steel-light">{impressionDates(imp)}</span>
                  )}
                </label>
                <FitBadge fit={fit.fit} label={fit.label} />
                <Link
                  href={`/kits/${imp.id}`}
                  className="text-xs text-brass underline-offset-2 hover:underline dark:text-brass-light"
                >
                  Open
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {saved && (
        <div className="mt-4">
          <label htmlFor="artifact-notes" className="mb-1 block text-sm font-medium">
            My notes
          </label>
          <textarea
            id="artifact-notes"
            key={saved.id}
            defaultValue={saved.notes}
            onBlur={(e) => {
              if (e.target.value !== saved.notes) updateSavedArtifact(saved.id, { notes: e.target.value });
            }}
            rows={3}
            maxLength={4000}
            placeholder="Construction details, what to copy, where it differs from your kit…"
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink"
          />
        </div>
      )}
    </div>
  );
}
