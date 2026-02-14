'use client';

import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { SearchResults } from '@/components/search/SearchResults';
import { useSearch } from '@/hooks/useSearch';

export default function Home() {
  const { filters, setFilters, setQuery, results, isLoading, search } = useSearch();

  const handleSearch = (query: string) => {
    setQuery(query);
    search({ query });
  };

  const handleFilterChange = (newFilters: Parameters<typeof setFilters>[0]) => {
    setFilters(newFilters);
  };

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
      <SearchResults results={results} isLoading={isLoading} onRetry={() => search()} />
    </div>
  );
}
