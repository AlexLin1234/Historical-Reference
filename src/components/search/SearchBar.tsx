'use client';

import { Search, X } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  initialQuery = '',
  placeholder = 'Try "15th century sallet", "viking brooch" or "frock coat 1860s"',
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-steel dark:text-steel-light"
          size={20}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          aria-label="Search museum collections"
          maxLength={300}
          enterKeyHint="search"
          className="w-full rounded-lg border border-black/20 bg-white py-4 pl-12 pr-36 text-lg outline-none transition-all placeholder:text-steel/50 focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:placeholder:text-steel-light/50 dark:focus:border-brass-light [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-28 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-steel hover:bg-black/5 dark:text-steel-light dark:hover:bg-white/10"
          >
            <X size={18} />
          </button>
        )}
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-brass px-4 py-2 font-medium text-white transition-colors hover:bg-brass-light dark:bg-brass-light dark:text-ink dark:hover:bg-brass"
        >
          Search
        </button>
      </div>
      <p className="mt-2 text-xs text-steel dark:text-steel-light">
        Dates in your search become a date filter. Use &quot;quotes&quot; for exact phrases and
        -word to exclude (e.g. <span className="font-mono">sallet -replica</span>).
      </p>
    </form>
  );
}
