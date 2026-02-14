'use client';

import { useState, FormEvent } from 'react';
import { Globe } from 'lucide-react';
import { scrapeUrl } from '@/lib/api/firecrawl';
import { normalizeScrapeResult } from '@/lib/normalizers/scrape';
import type { NormalizedArtifact } from '@/types/artifact';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

interface ScrapeFormProps {
  onScrapeComplete: (artifact: Partial<NormalizedArtifact>) => void;
  onLoadingChange: (loading: boolean) => void;
}

export function ScrapeForm({ onScrapeComplete, onLoadingChange }: ScrapeFormProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    onLoadingChange(true);
    setError(null);

    try {
      const response = await scrapeUrl(url.trim());
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
            htmlFor="url"
            className="mb-2 block text-sm font-medium text-steel dark:text-steel-light"
          >
            Museum Page URL
          </label>
          <div className="relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-steel dark:text-steel-light" size={20} />
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example-museum.org/artifact/12345"
              required
              className="w-full rounded-lg border border-black/20 bg-white px-12 py-3 outline-none transition-all placeholder:text-steel/50 focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:placeholder:text-steel-light/50 dark:focus:border-brass-light"
            />
          </div>
          <p className="mt-2 text-xs text-steel dark:text-steel-light">
            Enter the URL of a museum artifact page to extract its information
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
              Scraping...
            </>
          ) : (
            'Scrape Page'
          )}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}
    </div>
  );
}
