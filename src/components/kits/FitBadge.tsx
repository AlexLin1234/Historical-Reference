import { cn } from '@/lib/utils';
import type { DateFit } from '@/lib/dates';

const STYLES: Record<DateFit, string> = {
  'in-period': 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  near: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  out: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  undated: 'bg-steel/20 text-steel dark:bg-steel/30 dark:text-steel-light',
};

const MARK: Record<DateFit, string> = { 'in-period': '✓', near: '≈', out: '✕', undated: '?' };

/** Date-fit indicator. Carries a symbol as well as colour. */
export function FitBadge({ fit, label }: { fit: DateFit; label: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium',
        STYLES[fit]
      )}
    >
      <span aria-hidden>{MARK[fit]}</span>
      {label}
    </span>
  );
}
