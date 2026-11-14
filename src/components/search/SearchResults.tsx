'use client';

import { CalendarRange, X } from 'lucide-react';
import type { AggregatedSearchResults, SearchFilters } from '@/types/artifact';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArtifactCard } from '@/components/artifact/ArtifactCard';
import { Pagination } from '@/components/ui/Pagination';
import { DEFAULT_PAGE_SIZE, MAX_PAGES, MUSEUM_LABELS, SEARCH_SOURCES } from '@/lib/constants';

interface SearchResultsProps {
  results: AggregatedSearchResults | null;
  filters: SearchFilters;
  isLoading: boolean;
  hasQuery: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
  onRetry?: () => void;
  onSearch: (update: Partial<SearchFilters>) => void;
}

const chipClass =
  'rounded-full border border-black/15 px-3 py-1 text-sm transition-colors hover:border-brass hover:text-brass dark:border-white/20 dark:hover:border-brass-light dark:hover:text-brass-light';

const SHORT = new Map(SEARCH_SOURCES.map((s) => [s.id, s.shortLabel]));

export function SearchResults({
  results,
  filters,
  isLoading,
  hasQuery,
  currentPage,
  onPageChange,
  onRetry,
  onSearch,
}: SearchResultsProps) {
  if (!hasQuery) {
    return filters.sources.length === 0 ? (
      <EmptyState title="No museums selected" description="Tick at least one museum to search" />
    ) : (
      <EmptyState
        title="Start your search"
        description="Enter a keyword to search across museum collections"
      />
    );
  }

  if (isLoading || !results) {
    return (
      <div className="flex items-center justify-center py-16" role="status" aria-label="Searching">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  const artifacts = results.ranked;
  const { interpretation } = results;

  // Each page asks every museum for its own page N, so the number of pages is
  // set by the museum with the most results, not by the sum.
  const totalResults = results.results.reduce((sum, r) => sum + r.totalResults, 0);
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, ...results.results.map((r) => Math.ceil(r.totalResults / DEFAULT_PAGE_SIZE)))
  );

  return (
    <div className="space-y-6">
      {results.errors.length > 0 && (
        <div className="space-y-2">
          {results.errors.map((error) => (
            <ErrorMessage
              key={error.source}
              message={
                results.results.length === 0 && results.errors.length === 1
                  ? error.message
                  : `${MUSEUM_LABELS[error.source] ?? error.source} could not be searched: ${error.message}`
              }
              onRetry={onRetry}
            />
          ))}
        </div>
      )}

      {interpretation.dateFromQuery && interpretation.dateRange && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-brass/30 bg-brass/5 px-4 py-2.5 text-sm">
          <CalendarRange size={16} className="shrink-0 text-brass dark:text-brass-light" aria-hidden />
          <span>
            Searching <strong>{interpretation.text}</strong> dated{' '}
            <strong>{interpretation.dateRange.label}</strong>
          </span>
          <button
            type="button"
            onClick={() => onSearch({ literal: true })}
            className="inline-flex items-center gap-1 text-brass underline-offset-2 hover:underline dark:text-brass-light"
          >
            <X size={14} aria-hidden />
            Search for the exact words instead
          </button>
        </div>
      )}

      {results.didYouMean && (
        <p className="text-sm">
          Did you mean{' '}
          <button
            type="button"
            onClick={() => onSearch({ query: results.didYouMean! })}
            className="font-semibold text-brass underline-offset-2 hover:underline dark:text-brass-light"
          >
            {results.didYouMean}
          </button>
          ?
        </p>
      )}

      {artifacts.length === 0 && results.results.length > 0 && (
        <EmptyState
          title={totalResults > 0 ? 'Nothing on this page matches your filters' : 'No results found'}
          description={
            totalResults > 0
              ? 'Try the next page, or loosen the date range or category'
              : 'Try different words, a wider date range, or one of the related searches below'
          }
        />
      )}

      {artifacts.length > 0 && (
        <div>
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm text-steel dark:text-steel-light">
            <p>
              {artifacts.length} artifacts on page {currentPage} of{' '}
              {totalResults.toLocaleString()} matches
            </p>
            <p className="text-xs">
              {results.results
                .filter((r) => r.totalResults > 0)
                .map((r) => `${SHORT.get(r.source) ?? r.source} ${r.totalResults.toLocaleString()}`)
                .join(' · ')}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </div>
      )}

      {results.related.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-medium text-steel dark:text-steel-light">
            Related searches
          </h2>
          <div className="flex flex-wrap gap-2">
            {results.related.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() =>
                  onSearch({
                    query: term,
                    // Keep a date that was typed into the query as a real filter.
                    timePeriod:
                      filters.timePeriod ??
                      (interpretation.dateRange
                        ? {
                            label: interpretation.dateRange.label,
                            startYear: interpretation.dateRange.startYear,
                            endYear: interpretation.dateRange.endYear,
                          }
                        : null),
                  })
                }
                className={chipClass}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {results.results.length > 0 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  );
}
