import type { NormalizedArtifact } from '@/types/artifact';
import type { SavedArtifact, SessionCollection } from '@/types/collection';

const STORAGE_KEY = 'reenactors-reference-collection';
const SCHEMA_VERSION = 1;

function createEmptyCollection(): SessionCollection {
  return {
    version: SCHEMA_VERSION,
    artifacts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function getCollection(): SessionCollection {
  if (typeof window === 'undefined') return createEmptyCollection();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyCollection();

  try {
    const parsed: SessionCollection = JSON.parse(raw);
    if (parsed.version !== SCHEMA_VERSION) {
      return createEmptyCollection();
    }
    return parsed;
  } catch {
    return createEmptyCollection();
  }
}

function persist(collection: SessionCollection): void {
  collection.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(collection));
}

export function saveArtifact(artifact: NormalizedArtifact, notes = '', tags: string[] = []): void {
  const collection = getCollection();
  if (collection.artifacts.some((a) => a.id === artifact.id)) return;

  const saved: SavedArtifact = {
    ...artifact,
    savedAt: new Date().toISOString(),
    notes,
    tags,
  };

  collection.artifacts.push(saved);
  persist(collection);
}

export function removeArtifact(artifactId: string): void {
  const collection = getCollection();
  collection.artifacts = collection.artifacts.filter((a) => a.id !== artifactId);
  persist(collection);
}

export function updateArtifactNotes(artifactId: string, notes: string): void {
  const collection = getCollection();
  const artifact = collection.artifacts.find((a) => a.id === artifactId);
  if (artifact) {
    artifact.notes = notes;
    persist(collection);
  }
}

export function isArtifactSaved(artifactId: string): boolean {
  return getCollection().artifacts.some((a) => a.id === artifactId);
}

export function clearCollection(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportCollectionAsJSON(): string {
  const collection = getCollection();
  return JSON.stringify(collection.artifacts, null, 2);
}

export function exportCollectionAsCSV(): string {
  const collection = getCollection();
  if (collection.artifacts.length === 0) return '';

  const headers = ['title', 'date', 'artist', 'medium', 'culture', 'source', 'sourceUrl'];
  const rows = collection.artifacts.map((a) =>
    headers.map((h) => {
      const val = a[h as keyof SavedArtifact];
      const str = val == null ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(',')
  );

  return [headers.join(','), ...rows].join('\n');
}
