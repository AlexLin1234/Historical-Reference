'use client';

import Link from 'next/link';
import { Search, Globe, Bookmark } from 'lucide-react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useCollection } from '@/hooks/useCollection';

export function Header() {
  const { count } = useCollection();

  return (
    <header className="sticky top-0 z-40 border-b border-black/10 bg-parchment/80 backdrop-blur-sm dark:border-white/10 dark:bg-ink/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="text-brass">RR</span>
          <span className="hidden sm:inline">Reenactor&apos;s Reference</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Search size={16} />
            <span className="hidden sm:inline">Search</span>
          </Link>
          <Link
            href="/scrape"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Globe size={16} />
            <span className="hidden sm:inline">Scrape</span>
          </Link>
          <Link
            href="/collection"
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-black/10 dark:hover:bg-white/10"
          >
            <Bookmark size={16} />
            <span className="hidden sm:inline">Collection</span>
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brass px-1 text-xs font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          <div className="ml-2 border-l border-black/10 pl-2 dark:border-white/10">
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
}
