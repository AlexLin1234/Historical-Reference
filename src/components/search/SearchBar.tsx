'use client';

import { Search } from 'lucide-react';
import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
  placeholder?: string;
}

export function SearchBar({ onSearch, initialQuery = '', placeholder = 'Search for artifacts... (e.g., "Viking sword", "medieval armor")' }: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-steel dark:text-steel-light" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-black/20 bg-white px-12 py-4 text-lg outline-none transition-all placeholder:text-steel/50 focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:placeholder:text-steel-light/50 dark:focus:border-brass-light"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-brass px-4 py-2 font-medium text-white transition-colors hover:bg-brass-light dark:bg-brass-light dark:hover:bg-brass"
        >
          Search
        </button>
      </div>
    </form>
  );
}
