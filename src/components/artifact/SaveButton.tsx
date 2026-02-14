'use client';

import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { NormalizedArtifact } from '@/types/artifact';
import { useCollection } from '@/hooks/useCollection';

interface SaveButtonProps {
  artifact: NormalizedArtifact;
  variant?: 'default' | 'large';
}

export function SaveButton({ artifact, variant = 'default' }: SaveButtonProps) {
  const { isSaved, save, remove } = useCollection();
  const saved = isSaved(artifact.id);

  const handleToggle = () => {
    if (saved) {
      remove(artifact.id);
    } else {
      save(artifact);
    }
  };

  if (variant === 'large') {
    return (
      <button
        onClick={handleToggle}
        className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
          saved
            ? 'bg-brass text-white hover:bg-brass-light dark:bg-brass-light dark:hover:bg-brass'
            : 'border border-black/20 bg-white hover:bg-black/5 dark:border-white/20 dark:bg-ink dark:hover:bg-white/5'
        }`}
      >
        {saved ? <BookmarkCheck size={20} /> : <Bookmark size={20} />}
        {saved ? 'Saved to Collection' : 'Save to Collection'}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className="rounded-full bg-white/90 p-2 transition-colors hover:bg-white dark:bg-ink/90 dark:hover:bg-ink"
      aria-label={saved ? 'Remove from collection' : 'Save to collection'}
    >
      {saved ? (
        <BookmarkCheck size={18} className="text-brass" />
      ) : (
        <Bookmark size={18} className="text-steel dark:text-steel-light" />
      )}
    </button>
  );
}
