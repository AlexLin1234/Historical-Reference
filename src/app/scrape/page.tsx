'use client';

import { useState } from 'react';
import { ScrapeForm } from '@/components/scrape/ScrapeForm';
import { ScrapeResults } from '@/components/scrape/ScrapeResults';
import type { NormalizedArtifact } from '@/types/artifact';

export default function ScrapePage() {
  const [scrapedArtifact, setScrapedArtifact] = useState<Partial<NormalizedArtifact> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Web Scrape</h1>
        <p className="text-steel dark:text-steel-light">
          Scrape artifact data from museum pages without public APIs
        </p>
      </div>

      {/* Form */}
      <ScrapeForm
        onScrapeComplete={setScrapedArtifact}
        onLoadingChange={setIsLoading}
      />

      {/* Results */}
      {scrapedArtifact && !isLoading && (
        <div className="mt-8">
          <ScrapeResults artifact={scrapedArtifact} />
        </div>
      )}
    </div>
  );
}
