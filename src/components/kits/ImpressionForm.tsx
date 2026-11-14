'use client';

import { useState, FormEvent } from 'react';
import { REENACTMENT_ERAS } from '@/lib/constants';

export interface ImpressionDraft {
  name: string;
  description: string;
  startYear: number | null;
  endYear: number | null;
}

const fieldClass =
  'w-full rounded border border-black/20 bg-white px-3 py-2 text-sm outline-none focus:border-brass focus:ring-2 focus:ring-brass/20 dark:border-white/20 dark:bg-ink';

function parseYear(text: string): number | null | undefined {
  if (text.trim() === '') return null;
  return /^-?\d{1,4}$/.test(text.trim()) ? parseInt(text.trim(), 10) : undefined;
}

export function ImpressionForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: ImpressionDraft;
  submitLabel: string;
  onSubmit: (draft: ImpressionDraft) => void;
  onCancel?: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [from, setFrom] = useState(initial?.startYear == null ? '' : String(initial.startYear));
  const [to, setTo] = useState(initial?.endYear == null ? '' : String(initial.endYear));
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const a = parseYear(from);
    const b = parseYear(to);
    if (!name.trim()) return setError('Give the impression a name.');
    if (a === undefined || b === undefined) return setError('Years must be whole numbers (use a minus sign for BCE).');
    if (a !== null && b !== null && a > b) return setError('The start year must not be after the end year.');
    setError(null);
    onSubmit({ name: name.trim(), description: description.trim(), startYear: a ?? b, endYear: b ?? a });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="imp-name" className="mb-1 block text-sm font-medium">
          Name
        </label>
        <input
          id="imp-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="e.g. Yorkist billman, 1471"
          className={fieldClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="imp-era" className="mb-1 block text-sm font-medium">
            Era preset
          </label>
          <select
            id="imp-era"
            value=""
            onChange={(e) => {
              const era = REENACTMENT_ERAS.find((p) => p.label === e.target.value);
              if (era) {
                setFrom(String(era.startYear));
                setTo(String(era.endYear));
              }
            }}
            className={fieldClass}
          >
            <option value="">Choose to fill the years…</option>
            {REENACTMENT_ERAS.map((p) => (
              <option key={p.label} value={p.label}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="imp-from" className="mb-1 block text-sm font-medium">
            Portrayal from (year)
          </label>
          <input id="imp-from" inputMode="numeric" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="1455" className={fieldClass} />
        </div>
        <div>
          <label htmlFor="imp-to" className="mb-1 block text-sm font-medium">
            to (year)
          </label>
          <input id="imp-to" inputMode="numeric" value={to} onChange={(e) => setTo(e.target.value)} placeholder="1487" className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="imp-desc" className="mb-1 block text-sm font-medium">
          Who are you portraying? <span className="font-normal text-steel dark:text-steel-light">(optional)</span>
        </label>
        <textarea
          id="imp-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Status, region, occupation, the event or unit this kit is for…"
          className={fieldClass}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          className="rounded-lg bg-brass px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brass-light dark:bg-brass-light dark:text-ink dark:hover:bg-brass"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-black/20 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
