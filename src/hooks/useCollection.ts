'use client';

import { useState, useEffect, useCallback } from 'react';
import type { NormalizedArtifact } from '@/types/artifact';
import type { SessionCollection } from '@/types/collection';
import {
  getCollection,
  saveArtifact,
  removeArtifact,
  isArtifactSaved,
  clearCollection,
  exportCollectionAsJSON,
  exportCollectionAsCSV,
} from '@/lib/storage';

function createEmptyCollection(): SessionCollection {
  return {
    version: 1,
    artifacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function useCollection() {
  const [collection, setCollection] = useState<SessionCollection>(createEmptyCollection);

  const refresh = useCallback(() => {
    setCollection(getCollection());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'reenactors-reference-collection') {
        refresh();
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, [refresh]);

  const save = useCallback(
    (artifact: NormalizedArtifact) => {
      saveArtifact(artifact);
      refresh();
    },
    [refresh]
  );

  const remove = useCallback(
    (id: string) => {
      removeArtifact(id);
      refresh();
    },
    [refresh]
  );

  const isSaved = useCallback((id: string) => isArtifactSaved(id), []);

  const clear = useCallback(() => {
    clearCollection();
    refresh();
  }, [refresh]);

  return {
    collection,
    save,
    remove,
    isSaved,
    clear,
    exportJSON: exportCollectionAsJSON,
    exportCSV: exportCollectionAsCSV,
    count: collection.artifacts.length,
  };
}
