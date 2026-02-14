'use client';

import type { AggregatedSearchResults } from '@/types/artifact';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArtifactCard } from '@/components/artifact/ArtifactCard';

interface SearchResultsProps {
  results: AggregatedSearchResults | null;
  isLoading: boolean;
  onRetry?: () => void;
}

export function SearchResults({ results, isLoading, onRetry }: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size={40} />
      </div>
    );
  }

  if (!results) {
    return (
      <EmptyState
        title="Start your search"
        description="Enter a keyword to search across museum collections"
      />
    );
  }

  const allArtifacts = results.results.flatMap((r) => r.artifacts);
  const hasResults = allArtifacts.length > 0;

  if (!hasResults && results.errors.length === 0) {
    return (
      <EmptyState
        title="No results found"
        description="Try adjusting your search terms or filters"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Errors */}
      {results.errors.length > 0 && (
        <div className="space-y-2">
          {results.errors.map((error) => (
            <ErrorMessage
              key={error.source}
              message={`${error.source}: ${error.message}`}
              onRetry={onRetry}
            />
          ))}
        </div>
      )}

      {/* Results Grid */}
      {hasResults && (
        <div>
          <p className="mb-4 text-sm text-steel dark:text-steel-light">
            Found {allArtifacts.length} artifacts across {results.results.length} museums
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {allArtifacts.map((artifact) => (
              <ArtifactCard key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
