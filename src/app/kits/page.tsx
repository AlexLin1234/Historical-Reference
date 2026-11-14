'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Plus, Shirt } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { createImpression } from '@/lib/storage';
import { describeFit, impressionDates } from '@/lib/citation';
import { ImpressionForm } from '@/components/kits/ImpressionForm';
import { ArtifactImage } from '@/components/artifact/ArtifactImage';

export default function KitsPage() {
  const router = useRouter();
  const { collection } = useCollection();
  const [creating, setCreating] = useState(false);
  const impressions = collection.impressions;
  const byId = new Map(collection.artifacts.map((a) => [a.id, a]));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Impressions</h1>
          <p className="mt-1 max-w-2xl text-steel dark:text-steel-light">
            An impression is one portrayal: a person, place and date. Gather the museum pieces
            that justify each item of kit, check they fall inside your dates, and print a
            documentation sheet for your group&apos;s authenticity officer.
          </p>
        </div>
        {!creating && (
          <button
            onClick={() => setCreating(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brass px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brass-light dark:bg-brass-light dark:text-ink dark:hover:bg-brass"
          >
            <Plus size={16} />
            New impression
          </button>
        )}
      </div>

      {creating && (
        <div className="mb-8 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink">
          <h2 className="mb-4 text-lg font-semibold">New impression</h2>
          <ImpressionForm
            submitLabel="Create impression"
            onCancel={() => setCreating(false)}
            onSubmit={(draft) => {
              const created = createImpression(draft);
              router.push(`/kits/${created.id}`);
            }}
          />
        </div>
      )}

      {impressions.length === 0 && !creating ? (
        <div className="flex flex-col items-center py-16 text-center text-steel dark:text-steel-light">
          <Shirt size={48} strokeWidth={1} className="mb-4" />
          <h2 className="text-lg font-medium">No impressions yet</h2>
          <p className="mt-1 max-w-md text-sm">
            Create one for each portrayal you do, for example &ldquo;Yorkist billman, 1471&rdquo; or
            &ldquo;Union infantry private, 1863&rdquo;.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {impressions.map((imp) => {
            const items = imp.artifactIds.map((id) => byId.get(id)).filter((a) => a !== undefined);
            const fits = items.map((a) => describeFit(a, imp).fit);
            const outside = fits.filter((f) => f === 'out').length;
            return (
              <li key={imp.id}>
                <Link
                  href={`/kits/${imp.id}`}
                  className="block h-full rounded-lg border border-black/10 bg-white p-5 transition-shadow hover:shadow-lg dark:border-white/10 dark:bg-ink"
                >
                  <h2 className="text-lg font-semibold">{imp.name}</h2>
                  <p className="mt-0.5 text-sm text-steel dark:text-steel-light">
                    {impressionDates(imp) ?? 'No target dates'} · {items.length} reference
                    {items.length === 1 ? '' : 's'}
                    {outside > 0 && (
                      <span className="text-red-700 dark:text-red-400"> · {outside} out of period</span>
                    )}
                  </p>
                  {items.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {items.slice(0, 5).map((a) => (
                        <div key={a.id} className="h-14 w-14 overflow-hidden rounded bg-steel/10">
                          <ArtifactImage src={a.primaryImageSmall || a.primaryImage} alt="" />
                        </div>
                      ))}
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
