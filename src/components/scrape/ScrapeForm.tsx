'use client';

import { useState, FormEvent } from 'react';
import { Globe, Search } from 'lucide-react';
import { scrapeUrl } from '@/lib/api/firecrawl';
import { normalizeScrapeResult } from '@/lib/normalizers/scrape';
import { SCRAPABLE_MUSEUMS } from '@/lib/constants';
import type { NormalizedArtifact } from '@/types/artifact';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface ScrapeFormProps {
  onScrapeComplete: (artifact: Partial<NormalizedArtifact>) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function ScrapeForm({ onScrapeComplete, onLoadingChange }: ScrapeFormProps) {
  const [selectedMuseum, setSelectedMuseum] = useState(SCRAPABLE_MUSEUMS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    const url = `${selectedMuseum.searchUrl}${encodeURIComponent(searchTerm.trim())}`;

    setIsLoading(true);
    onLoadingChange(true);
    setError(null);

    try {
      const response = await scrapeUrl(url);
      const normalized = normalizeScrapeResult(
        response.data.markdown,
        url,
        response.data.metadata
      );
      onScrapeComplete(normalized);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
      onLoadingChange(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="museum"
            className="mb-2 block text-sm font-medium text-steel dark:text-steel-light"
          >
            Select Museum
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-steel dark:text-steel-light" size={20} />
            <select
              id="museum"
              value={selectedMuseum.name}
              onChange={(e) => {
                const museum = SCRAPABLE_MUSEUMS.find((m) => m.name === e.target.value);
                if (museum) setSelectedMuseum(museum);
              }}
              className="w-full appearance-none rounded-lg border border-black/20 bg-white px-12 py-3 outline-none transition-all focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:focus:border-brass-light"
            >
              {SCRAPABLE_MUSEUMS.map((museum) => (
                <option key={museum.name} value={museum.name}>
                  {museum.name}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-2 text-xs text-steel dark:text-steel-light">
            {selectedMuseum.description}
          </p>
        </div>

        <div>
          <label
            htmlFor="searchTerm"
            className="mb-2 block text-sm font-medium text-steel dark:text-steel-light"
          >
            Search Term
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-steel dark:text-steel-light" size={20} />
            <input
              type="text"
              id="searchTerm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="e.g., medieval sword, renaissance painting"
              required
              className="w-full rounded-lg border border-black/20 bg-white px-12 py-3 outline-none transition-all placeholder:text-steel/50 focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:placeholder:text-steel-light/50 dark:focus:border-brass-light"
            />
          </div>
          <p className="mt-2 text-xs text-steel dark:text-steel-light">
            Enter keywords to search for artifacts at {selectedMuseum.name}
          </p>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brass px-6 py-3 font-medium text-white transition-colors hover:bg-brass-light disabled:opacity-50 dark:bg-brass-light dark:hover:bg-brass"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size={20} />
              Scraping {selectedMuseum.name}...
            </>
          ) : (
            'Search and Scrape'
          )}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
