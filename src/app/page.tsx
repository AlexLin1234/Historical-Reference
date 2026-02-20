'use client';

import { useCallback, useRef } from 'react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';

export default function Home() {
  const { filters, setFilters, setQuery, results, isLoading, page, setPage, search } = useSearch();
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = (query: string) => {
    setQuery(query);
    search({ query });
  };

  const handleFilterChange = (newFilters: Parameters<typeof setFilters>[0]) => {
    setFilters(newFilters);
    // Re-run search with updated filters if there's already a query
    if (filters.query.trim()) {
      search(newFilters);
    }
  };

  const handlePageChange = useCallback(
    (newPage: number) => {
      setPage(newPage);
      search(undefined, newPage);
      // Scroll to top of results
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [setPage, search]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-4xl font-bold tracking-tight">
          Reenactor&apos;s Reference
        </h1>
        <p className="text-lg text-steel dark:text-steel-light">
          Search historical artifacts across museum collections
        </p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Filters */}
      <div className="mb-8">
        <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Results */}
      <div ref={resultsRef}>
        <SearchResults
          results={results}
          isLoading={isLoading}
          currentPage={page}
          onPageChange={handlePageChange}
          onRetry={() => search()}
        />
      </div>
    </div>
  );
}
