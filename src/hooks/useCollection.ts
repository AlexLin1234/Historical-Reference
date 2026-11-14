'use client';

import { useCallback, useSyncExternalStore } from 'react';
import {
  EMPTY_COLLECTION,
  getCollection,
  subscribe,
  saveArtifact,
  removeArtifact,
  clearCollection,
  exportCollectionAsJSON,
  exportCollectionAsCSV,
} from '@/lib/storage';

const getServerSnapshot = () => EMPTY_COLLECTION;

/**
 * Shared view of the saved collection. Backed by one external store, so every
 * component (header badge, cards, pages) updates together when anything is
 * saved or removed, including from another tab.
 */
export function useCollection() {
  const collection = useSyncExternalStore(subscribe, getCollection, getServerSnapshot);

  const isSaved = useCallback(
    (id: string) => collection.artifacts.some((a) => a.id === id),
    [collection]
  );

  return {
    collection,
    save: saveArtifact,
    remove: removeArtifact,
    isSaved,
    clear: clearCollection,
    exportJSON: exportCollectionAsJSON,
    exportCSV: exportCollectionAsCSV,
    count: collection.artifacts.length,
  };
}
