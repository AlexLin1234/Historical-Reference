'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Bookmark, Shirt, Upload } from 'lucide-react';
import { useCollection } from '@/hooks/useCollection';
import { importCollectionFromJSON } from '@/lib/storage';
import { CollectionList } from '@/components/collection/CollectionList';
import { ExportButton } from '@/components/collection/ExportButton';
import { EmptyState } from '@/components/ui/EmptyState';

const buttonClass =
  'inline-flex items-center gap-2 rounded-lg border border-black/20 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5';

function ImportButton({ onMessage }: { onMessage: (m: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (!file) return;
          try {
            const added = importCollectionFromJSON(await file.text());
            onMessage(
              `Imported ${added.artifacts} artifact${added.artifacts === 1 ? '' : 's'} and ${added.impressions} impression${added.impressions === 1 ? '' : 's'}. Items you already had were skipped.`
            );
          } catch (err) {
            onMessage(`Import failed: ${(err as Error).message}`);
          }
        }}
      />
      <button type="button" onClick={() => input.current?.click()} className={buttonClass}>
        <Upload size={16} />
        Import
      </button>
    </>
  );
}

export default function CollectionPage() {
  const { collection, clear, count } = useCollection();
  const [message, setMessage] = useState<string | null>(null);

  const status = message && (
    <p role="status" className="mb-6 rounded-lg border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/10 dark:bg-ink">
      {message}
    </p>
  );

  if (count === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        {status}
        <EmptyState
          icon={<Bookmark size={48} strokeWidth={1} />}
          title="No saved artifacts yet"
          description="Start searching and save artifacts to your collection, or import a previous export"
        />
        <div className="flex justify-center">
          <ImportButton onMessage={setMessage} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Collection</h1>
          <p className="mt-1 text-steel dark:text-steel-light">
            {count} {count === 1 ? 'artifact' : 'artifacts'} saved in this browser
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/kits" className={buttonClass}>
            <Shirt size={16} />
            Impressions
          </Link>
          <ImportButton onMessage={setMessage} />
          <ExportButton />
          <button
            onClick={() => {
              if (
                window.confirm(
                  `Remove all ${count} saved artifacts and ${collection.impressions.length} impressions? This cannot be undone. Export first if you want a backup.`
                )
              ) {
                clear();
                setMessage('Collection cleared.');
              }
            }}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Clear All
          </button>
        </div>
      </div>

      {status}
      <CollectionList artifacts={collection.artifacts} />
    </div>
  );
}
