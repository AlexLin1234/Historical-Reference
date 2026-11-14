'use client';

import Link from 'next/link';
import { StickyNote, X } from 'lucide-react';
import type { SavedArtifact } from '@/types/collection';
import { Badge } from '@/components/ui/Badge';
import { ArtifactImage } from '@/components/artifact/ArtifactImage';
import { artifactHref } from '@/components/artifact/ArtifactCard';
import { MUSEUM_LABELS } from '@/lib/constants';
import { removeArtifact } from '@/lib/storage';

interface CollectionItemProps {
  artifact: SavedArtifact;
}

export function CollectionItem({ artifact }: CollectionItemProps) {
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
            {artifact.artist && <p className="line-clamp-1">{artifact.artist}</p>}
            {artifact.notes && (
              <p className="flex items-start gap-1 line-clamp-2">
                <StickyNote size={12} className="mt-0.5 shrink-0" aria-hidden />
                <span className="line-clamp-2">{artifact.notes}</span>
              </p>
            )}
          </div>

          <div className="mt-3">
            <Badge variant={artifact.source}>{MUSEUM_LABELS[artifact.source]}</Badge>
          </div>
        </div>
      </Link>

      {/* Always visible: hover-only controls are unreachable on touch screens. */}
      <button
        type="button"
        onClick={() => removeArtifact(artifact.id)}
        className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 shadow-sm transition-colors hover:bg-red-600 hover:text-white dark:bg-ink/90 dark:text-red-400"
        aria-label={`Remove ${artifact.title} from collection`}
      >
        <X size={14} />
      </button>
    </div>
  );
}
