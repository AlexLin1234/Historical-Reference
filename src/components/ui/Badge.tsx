import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'met' | 'va' | 'cleveland' | 'scraped';
  className?: string;
}

const variantClasses: Record<string, string> = {
  default: 'bg-steel/20 text-steel dark:bg-steel/30 dark:text-steel-light',
  met: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  va: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
  cleveland: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  scraped: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
};

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
