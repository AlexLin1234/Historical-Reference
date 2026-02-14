'use client';

import type { NormalizedArtifact } from '@/types/artifact';
import { ImageViewer } from './ImageViewer';
import { MetadataTable } from './MetadataTable';
import { SaveButton } from './SaveButton';
import { ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { MUSEUM_LABELS } from '@/lib/constants';

interface ArtifactDetailProps {
  artifact: NormalizedArtifact;
}

export function ArtifactDetail({ artifact }: ArtifactDetailProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          <h1 className="mb-2 text-3xl font-bold">{artifact.title}</h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={artifact.source}>
              {MUSEUM_LABELS[artifact.source]}
            </Badge>
            {artifact.isPublicDomain && (
              <Badge variant="default">Public Domain</Badge>
            )}
          </div>
        </div>
        <SaveButton artifact={artifact} />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Image - 2 columns */}
        <div className="lg:col-span-2">
          <ImageViewer
            primaryImage={artifact.primaryImage}
            additionalImages={artifact.additionalImages}
            alt={artifact.title}
          />
        </div>

        {/* Metadata - 1 column */}
        <div>
          <MetadataTable artifact={artifact} />
        </div>
      </div>

      {/* Description */}
      {artifact.description && (
        <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink">
          <h2 className="mb-3 text-lg font-semibold">Description</h2>
          <p className="leading-relaxed text-steel dark:text-steel-light">
            {artifact.description}
          </p>
        </div>
      )}

      {/* View at Museum */}
      <div className="rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-ink">
        <a
          href={artifact.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-medium text-brass hover:text-brass-light dark:text-brass-light dark:hover:text-brass"
        >
          View at {MUSEUM_LABELS[artifact.source]}
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
}
