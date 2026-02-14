'use client';

import { useCollection } from '@/hooks/useCollection';
import { CollectionList } from '@/components/collection/CollectionList';
import { ExportButton } from '@/components/collection/ExportButton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Bookmark } from 'lucide-react';

export default function CollectionPage() {
  const { collection, clear, count } = useCollection();

  if (count === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16">
        <EmptyState
          icon={<Bookmark size={48} strokeWidth={1} />}
          title="No saved artifacts yet"
          description="Start searching and save artifacts to your collection"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Collection</h1>
          <p className="mt-1 text-steel dark:text-steel-light">
            {count} {count === 1 ? 'artifact' : 'artifacts'} saved
          </p>
        </div>

        <div className="flex gap-3">
          <ExportButton />
          <button
            onClick={clear}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Collection List */}
      <CollectionList artifacts={collection.artifacts} />
    </div>
  );
}
