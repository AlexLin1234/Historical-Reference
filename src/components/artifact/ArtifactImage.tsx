'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ArtifactImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** How the image fits its box. */
  fit?: 'cover' | 'contain';
  eager?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Museum images come from dozens of hosts (and from arbitrary sites for
 * scraped records), are already sized by the museum's image server, and
 * sometimes 404. A plain <img> with a fallback handles all of that; routing
 * them through the Next.js optimizer would require allow-listing every host
 * and crash the page on any that was missed.
 */
export function ArtifactImage({ src, alt, className, fit = 'cover', eager, onClick }: ArtifactImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-1 text-xs text-steel dark:text-steel-light',
          className
        )}
      >
        <ImageOff size={22} strokeWidth={1.5} aria-hidden />
        <span>{src ? 'Image unavailable' : 'No image'}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setFailedSrc(src)}
      onClick={onClick}
      className={cn(
        'h-full w-full',
        fit === 'cover' ? 'object-cover' : 'object-contain',
        className
      )}
    />
  );
}
