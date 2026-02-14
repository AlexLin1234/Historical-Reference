'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import type { NormalizedArtifact } from '@/types/artifact';
import { useCollection } from '@/hooks/useCollection';

interface ScrapeResultsProps {
  artifact: Partial<NormalizedArtifact>;
}

export function ScrapeResults({ artifact: initialArtifact }: ScrapeResultsProps) {
  const [artifact, setArtifact] = useState(initialArtifact);
  const [saved, setSaved] = useState(false);
  const { save } = useCollection();

  const handleSave = () => {
    if (artifact.id && artifact.title && artifact.source && artifact.sourceId && artifact.sourceUrl) {
      save(artifact as NormalizedArtifact);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  const updateField = (field: keyof NormalizedArtifact, value: string) => {
    setArtifact((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink">
      <h2 className="text-xl font-semibold">Scraped Data</h2>

      <p className="text-sm text-steel dark:text-steel-light">
        Review and edit the extracted information before saving to your collection
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Image Preview */}
        {artifact.primaryImage && (
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium">Image</label>
            <div className="relative aspect-video overflow-hidden rounded-lg bg-steel/10 dark:bg-steel-light/10">
              <Image
                src={artifact.primaryImage}
                alt={artifact.title || 'Scraped artifact'}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
          </div>
        )}

        {/* Editable Fields */}
        <div>
          <label className="mb-2 block text-sm font-medium">Title</label>
          <input
            type="text"
            value={artifact.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Date</label>
          <input
            type="text"
            value={artifact.date || ''}
            onChange={(e) => updateField('date', e.target.value)}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Artist</label>
          <input
            type="text"
            value={artifact.artist || ''}
            onChange={(e) => updateField('artist', e.target.value)}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Culture</label>
          <input
            type="text"
            value={artifact.culture || ''}
            onChange={(e) => updateField('culture', e.target.value)}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Medium</label>
          <input
            type="text"
            value={artifact.medium || ''}
            onChange={(e) => updateField('medium', e.target.value)}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Classification</label>
          <input
            type="text"
            value={artifact.classification || ''}
            onChange={(e) => updateField('classification', e.target.value)}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>

        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium">Description</label>
          <textarea
            value={artifact.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            rows={3}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-ink"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saved}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brass px-6 py-3 font-medium text-white transition-colors hover:bg-brass-light disabled:opacity-50 dark:bg-brass-light dark:hover:bg-brass"
      >
        {saved ? (
          <>
            <Check size={20} />
            Saved to Collection
          </>
        ) : (
          'Save to Collection'
        )}
      </button>
    </div>
  );
}
