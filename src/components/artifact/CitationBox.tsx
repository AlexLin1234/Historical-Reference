'use client';

import { Check, Copy, Quote } from 'lucide-react';
import type { NormalizedArtifact } from '@/types/artifact';
import { buildCitation } from '@/lib/citation';
import { useCopy } from '@/hooks/useCopy';

export function CitationBox({ artifact }: { artifact: NormalizedArtifact }) {
  const { copied, copy } = useCopy();
  const citation = buildCitation(artifact);

  return (
    <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <Quote size={18} className="text-brass dark:text-brass-light" aria-hidden />
          Cite this piece
        </h2>
        <button
          type="button"
          onClick={() => copy(citation)}
          className="inline-flex items-center gap-1.5 rounded border border-black/20 px-3 py-1.5 text-sm transition-colors hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5 print:hidden"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <p className="break-words text-sm leading-relaxed text-steel dark:text-steel-light">
        {citation}
      </p>
    </div>
  );
}
