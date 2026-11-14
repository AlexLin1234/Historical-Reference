'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { ArtifactImage } from './ArtifactImage';

interface ImageViewerProps {
  primaryImage: string | null;
  additionalImages: string[];
  alt: string;
}

export function ImageViewer({ primaryImage, additionalImages, alt }: ImageViewerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allImages = [...new Set([primaryImage, ...additionalImages].filter(Boolean) as string[])];

  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [isModalOpen]);

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-steel/10 dark:bg-steel-light/10">
        <p className="text-steel dark:text-steel-light">No image available</p>
      </div>
    );
  }

  const currentImage =
    selectedImage && allImages.includes(selectedImage) ? selectedImage : allImages[0];

  return (
    <div className="space-y-4">
      <button
        type="button"
        className="block aspect-square w-full cursor-zoom-in overflow-hidden rounded-lg bg-steel/10 dark:bg-steel-light/10"
        onClick={() => setIsModalOpen(true)}
        aria-label="Enlarge image"
      >
        <ArtifactImage src={currentImage} alt={alt} fit="contain" eager />
      </button>

      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 print:hidden">
          {allImages.map((img, idx) => (
            <button
              type="button"
              key={img}
              onClick={() => setSelectedImage(img)}
              aria-label={`Show view ${idx + 1}`}
              aria-pressed={img === currentImage}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded border-2 transition-all ${
                img === currentImage
                  ? 'border-brass dark:border-brass-light'
                  : 'border-black/10 hover:border-brass/50 dark:border-white/10 dark:hover:border-brass-light/50'
              }`}
            >
              <ArtifactImage src={img} alt="" />
            </button>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={alt}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            type="button"
            autoFocus
            aria-label="Close"
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setIsModalOpen(false)}
          >
            <X size={24} />
          </button>
          <div className="max-h-[90vh] max-w-[90vw]">
            <ArtifactImage
              src={currentImage}
              alt={alt}
              fit="contain"
              eager
              className="max-h-[90vh] w-auto text-white"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
