'use client';

import Link from 'next/link';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { NormalizedArtifact } from '@/types/artifact';
import { Badge } from '@/components/ui/Badge';
import { ArtifactImage } from './ArtifactImage';
import { MUSEUM_LABELS } from '@/lib/constants';
import { useCollection } from '@/hooks/useCollection';

interface ArtifactCardProps {
  artifact: NormalizedArtifact;
}

export function artifactHref(artifact: Pick<NormalizedArtifact, 'source' | 'sourceId'>): string {
  return `/artifact/${artifact.source}/${encodeURIComponent(artifact.sourceId)}`;
}

export function ArtifactCard({ artifact }: ArtifactCardProps) {
  const { isSaved, save, remove } = useCollection();
  const saved = isSaved(artifact.id);

  return (
    <div className="group relative overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:shadow-lg dark:border-white/10 dark:bg-ink">
      <Link href={artifactHref(artifact)} className="block">
        <div className="aspect-square overflow-hidden bg-steel/10 dark:bg-steel-light/10">
          <ArtifactImage
            src={artifact.primaryImageSmall || artifact.primaryImage}
            alt={artifact.title}
            className="transition-transform group-hover:scale-105"
          />
        </div>

        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">{artifact.title}</h3>

          <div className="mt-2 space-y-1 text-xs text-steel dark:text-steel-light">
            {artifact.date && <p className="line-clamp-1">{artifact.date}</p>}
            {(artifact.artist || artifact.culture) && (
              <p className="line-clamp-1">{artifact.artist || artifact.culture}</p>
            )}
          </div>

          <div className="mt-3">
            <Badge variant={artifact.source}>{MUSEUM_LABELS[artifact.source]}</Badge>
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={() => (saved ? remove(artifact.id) : save(artifact))}
        className="absolute right-2 top-2 rounded-full bg-white/90 p-2 shadow-sm transition-colors hover:bg-white dark:bg-ink/90 dark:hover:bg-ink"
        aria-label={saved ? 'Remove from collection' : 'Save to collection'}
        aria-pressed={saved}
      >
        {saved ? (
          <BookmarkCheck size={18} className="text-brass dark:text-brass-light" />
        ) : (
          <Bookmark size={18} className="text-steel dark:text-steel-light" />
        )}
      </button>
    </div>
  );
}
