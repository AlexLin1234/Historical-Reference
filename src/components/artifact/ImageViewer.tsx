'use client';

import { useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

interface ImageViewerProps {
  primaryImage: string | null;
  additionalImages: string[];
  alt: string;
}

export function ImageViewer({ primaryImage, additionalImages, alt }: ImageViewerProps) {
  const [selectedImage, setSelectedImage] = useState(primaryImage);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allImages = [primaryImage, ...additionalImages].filter(Boolean) as string[];

  if (allImages.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-lg bg-steel/10 dark:bg-steel-light/10">
        <p className="text-steel dark:text-steel-light">No image available</p>
      </div>
    );
  }

  const currentImage = selectedImage || allImages[0];

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div
        className="relative aspect-square cursor-zoom-in overflow-hidden rounded-lg bg-steel/10 dark:bg-steel-light/10"
        onClick={() => setIsModalOpen(true)}
      >
        <Image
          src={currentImage}
          alt={alt}
          fill
          className="object-contain"
          sizes="(max-width: 1024px) 100vw, 66vw"
          priority
        />
      </div>

      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImage(img)}
              className={`relative h-20 w-20 shrink-0 overflow-hidden rounded border-2 transition-all ${
                img === currentImage
                  ? 'border-brass dark:border-brass-light'
                  : 'border-black/10 hover:border-brass/50 dark:border-white/10 dark:hover:border-brass-light/50'
              }`}
            >
              <Image
                src={img}
                alt={`${alt} - view ${idx + 1}`}
                fill
                className="object-cover"
                sizes="80px"
              />
            </button>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            onClick={() => setIsModalOpen(false)}
          >
            <X size={24} />
          </button>
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <Image
              src={currentImage}
              alt={alt}
              width={1200}
              height={1200}
              className="h-auto max-h-[90vh] w-auto object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
