import { Search } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center text-steel dark:text-steel-light">
      <div className="mb-4">{icon || <Search size={48} strokeWidth={1} />}</div>
      <h3 className="text-lg font-medium">{title}</h3>
      {description && <p className="mt-1 max-w-md text-sm">{description}</p>}
    </div>
  );
}
