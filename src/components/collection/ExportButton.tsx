'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { useCollection } from '@/hooks/useCollection';

export function ExportButton() {
  const { exportJSON, exportCSV } = useCollection();
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: 'json' | 'csv') => {
    const data = format === 'json' ? exportJSON() : exportCSV();
    const blob = new Blob([data], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reenactors-collection-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-lg bg-brass px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brass-light dark:bg-brass-light dark:hover:bg-brass"
      >
        <Download size={16} />
        Export
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-ink">
            <button
              onClick={() => handleExport('json')}
              className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              Export as JSON
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="w-full px-4 py-3 text-left text-sm transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            >
              Export as CSV
            </button>
          </div>
        </>
      )}
    </div>
  );
}
