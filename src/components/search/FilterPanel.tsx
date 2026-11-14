'use client';

import { useState } from 'react';
import { Filter } from 'lucide-react';
import {
  TIME_PERIODS,
  REENACTMENT_ERAS,
  CATEGORIES,
  SEARCH_SOURCES,
  SEARCH_SOURCE_IDS,
} from '@/lib/constants';
import { periodFor } from '@/lib/search/url';
import type { SearchFilters, MuseumSource, SortOrder } from '@/types/artifact';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: Partial<SearchFilters>) => void;
}

const fieldClass =
  'w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink dark:focus:border-brass-light';
const labelClass = 'mb-1 block text-sm font-medium text-steel dark:text-steel-light';

const PRESETS = [...TIME_PERIODS, ...REENACTMENT_ERAS];

/** Custom year inputs; remounted (via key) whenever the applied range changes. */
function YearRange({
  from,
  to,
  onApply,
}: {
  from: number | null;
  to: number | null;
  onApply: (from: number | null, to: number | null) => void;
}) {
  const [fromText, setFromText] = useState(from === null ? '' : String(from));
  const [toText, setToText] = useState(to === null ? '' : String(to));

  const parse = (text: string): number | null | undefined => {
    if (text.trim() === '') return null;
    return /^-?\d{1,4}$/.test(text.trim()) ? parseInt(text.trim(), 10) : undefined;
  };
  const a = parse(fromText);
  const b = parse(toText);
  const invalid = a === undefined || b === undefined || (a != null && b != null && a > b);
  const dirty = a !== from || b !== to;

  return (
    <form
      className="mt-2 flex items-center gap-1.5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onApply(a ?? null, b ?? null);
      }}
    >
      <input
        inputMode="numeric"
        value={fromText}
        onChange={(e) => setFromText(e.target.value)}
        placeholder="From year"
        aria-label="From year (negative for BCE)"
        className={fieldClass}
      />
      <span className="text-steel dark:text-steel-light">–</span>
      <input
        inputMode="numeric"
        value={toText}
        onChange={(e) => setToText(e.target.value)}
        placeholder="To year"
        aria-label="To year (negative for BCE)"
        className={fieldClass}
      />
      <button
        type="submit"
        disabled={invalid || !dirty}
        className="shrink-0 rounded border border-brass px-2.5 py-2 text-sm font-medium text-brass transition-colors hover:bg-brass hover:text-white disabled:cursor-not-allowed disabled:border-black/20 disabled:text-steel/60 disabled:hover:bg-transparent dark:border-brass-light dark:text-brass-light dark:disabled:border-white/20 dark:disabled:text-steel-light/50"
      >
        Set
      </button>
    </form>
  );
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const toggleSource = (source: MuseumSource) => {
    const next = filters.sources.includes(source)
      ? filters.sources.filter((s) => s !== source)
      : [...filters.sources, source];
    // Keep the canonical order so equivalent selections share a URL.
    onFilterChange({ sources: SEARCH_SOURCE_IDS.filter((s) => next.includes(s)) });
  };

  const period = filters.timePeriod;
  const presetLabel =
    period && PRESETS.some((p) => p.label === period.label) ? period.label : period ? 'custom' : '';
  const allSelected = filters.sources.length === SEARCH_SOURCE_IDS.length;

  return (
    <div className="rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-ink">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Filter size={16} aria-hidden />
        <span>Filters</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="filter-period" className={labelClass}>
            Time period
          </label>
          <select
            id="filter-period"
            value={presetLabel}
            onChange={(e) => {
              if (e.target.value === 'custom') return;
              onFilterChange({
                timePeriod: PRESETS.find((p) => p.label === e.target.value) || null,
              });
            }}
            className={fieldClass}
          >
            <option value="">All periods</option>
            {presetLabel === 'custom' && period && (
              <option value="custom">Custom: {period.label}</option>
            )}
            <optgroup label="Broad periods">
              {TIME_PERIODS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Reenactment eras">
              {REENACTMENT_ERAS.map((p) => (
                <option key={p.label} value={p.label}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          </select>
          <YearRange
            key={`${period?.startYear ?? ''}:${period?.endYear ?? ''}`}
            from={period?.startYear ?? null}
            to={period?.endYear ?? null}
            onApply={(from, to) =>
              onFilterChange({
                timePeriod:
                  from === null && to === null ? null : periodFor(from ?? -3000, to ?? 2100),
              })
            }
          />
        </div>

        <div>
          <label htmlFor="filter-category" className={labelClass}>
            Category
          </label>
          <select
            id="filter-category"
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value || null })}
            className={fieldClass}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>

          <label htmlFor="filter-sort" className={`${labelClass} mt-3`}>
            Sort by
          </label>
          <select
            id="filter-sort"
            value={filters.sort || 'relevance'}
            onChange={(e) => onFilterChange({ sort: e.target.value as SortOrder })}
            className={fieldClass}
          >
            <option value="relevance">Best match</option>
            <option value="date-asc">Date: oldest first</option>
            <option value="date-desc">Date: newest first</option>
            <option value="title">Title A–Z</option>
          </select>
        </div>

        <fieldset>
          <legend className={`${labelClass} flex w-full items-center justify-between`}>
            <span>Museums</span>
            <button
              type="button"
              onClick={() => onFilterChange({ sources: allSelected ? [] : SEARCH_SOURCE_IDS })}
              className="text-xs font-normal text-brass underline-offset-2 hover:underline dark:text-brass-light"
            >
              {allSelected ? 'Clear all' : 'Select all'}
            </button>
          </legend>
          <div className="space-y-1">
            {SEARCH_SOURCES.map((source) => (
              <label key={source.id} className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.sources.includes(source.id)}
                  onChange={() => toggleSource(source.id)}
                  className="h-4 w-4 rounded border-black/20 accent-brass dark:border-white/20"
                />
                <span className="text-sm">{source.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span className={labelClass}>Options</span>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={filters.hasImage}
              onChange={(e) => onFilterChange({ hasImage: e.target.checked })}
              className="h-4 w-4 rounded border-black/20 accent-brass dark:border-white/20"
            />
            <span className="text-sm">Only items with images</span>
          </label>
        </div>
      </div>
    </div>
  );
}
