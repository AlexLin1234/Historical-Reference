'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { NormalizedArtifact } from '@/types/artifact';
import { Badge } from '@/components/ui/Badge';
import { MUSEUM_LABELS } from '@/lib/constants';
import { truncate } from '@/lib/utils';
import { useCollection } from '@/hooks/useCollection';

interface ArtifactCardProps {
  artifact: NormalizedArtifact;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const { isSaved, save, remove } = useCollection();
  const saved = isSaved(artifact.id);

  const handleToggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    if (saved) {
      remove(artifact.id);
    } else {
      save(artifact);
    }
  };

  return (
    <Link
      href={`/artifact/${artifact.source}/${artifact.sourceId}`}
      className="group relative overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:shadow-lg dark:border-white/10 dark:bg-ink"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-steel/10 dark:bg-steel-light/10">
        {artifact.primaryImageSmall ? (
          <Image
            src={artifact.primaryImageSmall}
            alt={artifact.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-steel dark:text-steel-light">
            No Image
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleToggleSave}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-2 transition-colors hover:bg-white dark:bg-ink/90 dark:hover:bg-ink"
          aria-label={saved ? 'Remove from collection' : 'Save to collection'}
        >
          {saved ? (
            <BookmarkCheck size={18} className="text-brass" />
          ) : (
            <Bookmark size={18} className="text-steel dark:text-steel-light" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {truncate(artifact.title, 80)}
          </h3>
        </div>

        <div className="space-y-1 text-xs text-steel dark:text-steel-light">
          {artifact.date && <p className="line-clamp-1">{artifact.date}</p>}
          {artifact.artist && <p className="line-clamp-1">{artifact.artist}</p>}
        </div>

        <div className="mt-3">
          <Badge variant={artifact.source}>
            {MUSEUM_LABELS[artifact.source]}
          </Badge>
        </div>
      </div>
    </Link>
  );
}
