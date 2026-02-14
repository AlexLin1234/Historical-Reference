import Link from 'next/link';
import Image from 'next/image';
import { X } from 'lucide-react';
import type { SavedArtifact } from '@/types/collection';
import { Badge } from '@/components/ui/Badge';
import { MUSEUM_LABELS } from '@/lib/constants';
import { truncate } from '@/lib/utils';
import { useCollection } from '@/hooks/useCollection';

interface CollectionItemProps {
  artifact: SavedArtifact;
}

export function CollectionItem({ artifact }: CollectionItemProps) {
  const { remove } = useCollection();

  return (
    <div className="group relative overflow-hidden rounded-lg border border-black/10 bg-white transition-all hover:shadow-lg dark:border-white/10 dark:bg-ink">
      <Link href={`/artifact/${artifact.source}/${artifact.sourceId}`}>
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
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {truncate(artifact.title, 80)}
          </h3>

          <div className="mt-2 space-y-1 text-xs text-steel dark:text-steel-light">
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

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          remove(artifact.id);
        }}
        className="absolute right-2 top-2 rounded-full bg-red-500 p-1.5 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        aria-label="Remove from collection"
      >
        <X size={14} />
      </button>
    </div>
  );
}
