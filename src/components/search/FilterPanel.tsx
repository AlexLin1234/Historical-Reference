'use client';

import { Filter } from 'lucide-react';
import { TIME_PERIODS, CATEGORIES, MUSEUM_LABELS } from '@/lib/constants';
import type { SearchFilters, MuseumSource } from '@/types/artifact';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const toggleSource = (source: MuseumSource) => {
    const newSources = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    onFilterChange({ sources: newSources });
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Filter size={16} />
        <span>Filters</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Time Period */}
        <div>
          <label className="mb-1 block text-sm font-medium text-steel dark:text-steel-light">
            Time Period
          </label>
          <select
            value={filters.timePeriod?.label || ''}
            onChange={(e) => {
              const period = TIME_PERIODS.find((p) => p.label === e.target.value) || null;
              onFilterChange({ timePeriod: period });
            }}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:focus:border-brass-light"
          >
            <option value="">All Periods</option>
            {TIME_PERIODS.map((period) => (
              <option key={period.label} value={period.label}>
                {period.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category */}
        <div>
          <label className="mb-1 block text-sm font-medium text-steel dark:text-steel-light">
            Category
          </label>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || null })}
            className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:focus:border-brass-light"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* Museums */}
        <div>
          <label className="mb-1 block text-sm font-medium text-steel dark:text-steel-light">
            Museums
          </label>
          <div className="space-y-1">
            {(['met', 'va', 'cleveland', 'smithsonian', 'harvard', 'chicago'] as const).map((source) => (
              <label key={source} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.sources.includes(source)}
                  onChange={() => toggleSource(source)}
                  className="h-4 w-4 rounded border-black/20 text-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20"
                />
                <span className="text-sm">{MUSEUM_LABELS[source]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Has Image */}
        <div>
          <label className="mb-1 block text-sm font-medium text-steel dark:text-steel-light">
            Options
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={filters.hasImage}
              onChange={(e) => onFilterChange({ hasImage: e.target.checked })}
              className="h-4 w-4 rounded border-black/20 text-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20"
            />
            <span className="text-sm">Has Image</span>
          </label>
        </div>
      </div>
    </div>
  );
}
