import type { NormalizedArtifact } from '@/types/artifact';
import type { Impression, SavedArtifact, SessionCollection } from '@/types/collection';

export const STORAGE_KEY = 'reenactors-reference-collection';
const SCHEMA_VERSION = 2;

function createEmptyCollection(): SessionCollection {
  const now = new Date().toISOString();
  return { version: SCHEMA_VERSION, artifacts: [], impressions: [], createdAt: now, updatedAt: now };
}

/** Stable empty value for server rendering and first paint. */
export const EMPTY_COLLECTION: SessionCollection = Object.freeze({
  version: SCHEMA_VERSION,
  artifacts: [],
  impressions: [],
  createdAt: '',
  updatedAt: '',
}) as SessionCollection;

/** Bring older saved data forward instead of discarding the user's collection. */
function migrate(parsed: unknown): SessionCollection | null {
  if (!parsed || typeof parsed !== 'object') return null;
  const data = parsed as Partial<SessionCollection>;
  if (!Array.isArray(data.artifacts)) return null;
  const now = new Date().toISOString();
  return {
    version: SCHEMA_VERSION,
    artifacts: data.artifacts
      .filter((a) => a && typeof a.id === 'string')
      .map((a) => ({ ...a, notes: a.notes ?? '', tags: Array.isArray(a.tags) ? a.tags : [] })),
    impressions: Array.isArray(data.impressions) ? data.impressions : [],
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
  };
}

// ── In-memory store (single source of truth for every component) ─────────────

let cache: SessionCollection | null = null;
const listeners = new Set<() => void>();

function read(): SessionCollection {
  if (typeof window === 'undefined') return EMPTY_COLLECTION;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyCollection();
    return migrate(JSON.parse(raw)) ?? createEmptyCollection();
  } catch {
    return createEmptyCollection();
  }
}

export function getCollection(): SessionCollection {
  if (typeof window === 'undefined') return EMPTY_COLLECTION;
  if (!cache) cache = read();
  return cache;
}

function emit() {
  for (const listener of listeners) listener();
}

/** Subscribe to collection changes (this tab and other tabs). */
export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === STORAGE_KEY) {
      cache = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

/** Apply an immutable update, persist it and notify subscribers. */
function update(fn: (c: SessionCollection) => SessionCollection): void {
  const next = { ...fn(getCollection()), updatedAt: new Date().toISOString() };
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Quota exceeded or storage disabled: keep working from memory.
  }
  emit();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Artifacts ────────────────────────────────────────────────────────────────

export function saveArtifact(artifact: NormalizedArtifact, notes = '', tags: string[] = []): void {
  update((c) => {
    if (c.artifacts.some((a) => a.id === artifact.id)) return c;
    const saved: SavedArtifact = { ...artifact, savedAt: new Date().toISOString(), notes, tags };
    return { ...c, artifacts: [...c.artifacts, saved] };
  });
}

export function removeArtifact(artifactId: string): void {
  update((c) => ({
    ...c,
    artifacts: c.artifacts.filter((a) => a.id !== artifactId),
    impressions: c.impressions.map((i) =>
      i.artifactIds.includes(artifactId)
        ? { ...i, artifactIds: i.artifactIds.filter((id) => id !== artifactId) }
        : i
    ),
  }));
}

export function updateSavedArtifact(
  artifactId: string,
  patch: Partial<Pick<SavedArtifact, 'notes' | 'tags' | 'kitSlot'>>
): void {
  update((c) => ({
    ...c,
    artifacts: c.artifacts.map((a) => (a.id === artifactId ? { ...a, ...patch } : a)),
  }));
}

/** Refresh a saved copy with a fuller record (e.g. after opening its detail page). */
export function refreshSavedArtifact(artifact: NormalizedArtifact): void {
  const existing = getCollection().artifacts.find((a) => a.id === artifact.id);
  if (!existing) return;
  const merged: SavedArtifact = { ...existing };
  let changed = false;
  for (const [key, value] of Object.entries(artifact) as [keyof NormalizedArtifact, unknown][]) {
    const empty = value === null || value === '' || (Array.isArray(value) && value.length === 0);
    if (empty) continue;
    if (JSON.stringify(existing[key]) !== JSON.stringify(value)) {
      (merged as unknown as Record<string, unknown>)[key] = value;
      changed = true;
    }
  }
  if (changed) {
    update((c) => ({
      ...c,
      artifacts: c.artifacts.map((a) => (a.id === artifact.id ? merged : a)),
    }));
  }
}

export function isArtifactSaved(artifactId: string): boolean {
  return getCollection().artifacts.some((a) => a.id === artifactId);
}

export function clearCollection(): void {
  update(() => createEmptyCollection());
}

// ── Impressions ──────────────────────────────────────────────────────────────

export function createImpression(
  input: Pick<Impression, 'name' | 'description' | 'startYear' | 'endYear'>
): Impression {
  const now = new Date().toISOString();
  const impression: Impression = {
    ...input,
    id: newId('imp'),
    artifactIds: [],
    createdAt: now,
    updatedAt: now,
  };
  update((c) => ({ ...c, impressions: [...c.impressions, impression] }));
  return impression;
}

export function updateImpression(
  id: string,
  patch: Partial<Pick<Impression, 'name' | 'description' | 'startYear' | 'endYear'>>
): void {
  update((c) => ({
    ...c,
    impressions: c.impressions.map((i) =>
      i.id === id ? { ...i, ...patch, updatedAt: new Date().toISOString() } : i
    ),
  }));
}

export function deleteImpression(id: string): void {
  update((c) => ({ ...c, impressions: c.impressions.filter((i) => i.id !== id) }));
}

export function setArtifactInImpression(
  impressionId: string,
  artifactId: string,
  included: boolean
): void {
  update((c) => ({
    ...c,
    impressions: c.impressions.map((i) => {
      if (i.id !== impressionId) return i;
      const has = i.artifactIds.includes(artifactId);
      if (included === has) return i;
      return {
        ...i,
        artifactIds: included
          ? [...i.artifactIds, artifactId]
          : i.artifactIds.filter((x) => x !== artifactId),
        updatedAt: new Date().toISOString(),
      };
    }),
  }));
}

// ── Import / export ──────────────────────────────────────────────────────────

export function exportCollectionAsJSON(): string {
  const { artifacts, impressions } = getCollection();
  return JSON.stringify({ version: SCHEMA_VERSION, artifacts, impressions }, null, 2);
}

/**
 * Merge a previously exported JSON file into the collection. Accepts both the
 * current format and the older bare array of artifacts. Returns counts added.
 */
export function importCollectionFromJSON(json: string): { artifacts: number; impressions: number } {
  const parsed: unknown = JSON.parse(json);
  const incoming = migrate(Array.isArray(parsed) ? { artifacts: parsed } : parsed);
  if (!incoming) throw new Error('This file is not a Reenactor’s Reference export.');

  let addedArtifacts = 0;
  let addedImpressions = 0;
  update((c) => {
    const haveArtifacts = new Set(c.artifacts.map((a) => a.id));
    const haveImpressions = new Set(c.impressions.map((i) => i.id));
    const artifacts = incoming.artifacts.filter(
      (a) => typeof a.title === 'string' && typeof a.sourceUrl === 'string' && !haveArtifacts.has(a.id)
    );
    const impressions = incoming.impressions.filter(
      (i) => i && typeof i.id === 'string' && Array.isArray(i.artifactIds) && !haveImpressions.has(i.id)
    );
    addedArtifacts = artifacts.length;
    addedImpressions = impressions.length;
    return {
      ...c,
      artifacts: [...c.artifacts, ...artifacts],
      impressions: [...c.impressions, ...impressions],
    };
  });
  return { artifacts: addedArtifacts, impressions: addedImpressions };
}

function csvCell(value: unknown): string {
  let str = value == null ? '' : Array.isArray(value) ? value.join('; ') : String(value);
  // Neutralise spreadsheet formula injection from scraped / third-party text.
  if (/^[=+\-@\t\r]/.test(str)) str = `'${str}`;
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportCollectionAsCSV(): string {
  const { artifacts } = getCollection();
  if (artifacts.length === 0) return '';

  const headers: (keyof SavedArtifact)[] = [
    'title', 'date', 'dateEarliest', 'dateLatest', 'artist', 'culture', 'classification',
    'medium', 'dimensions', 'accessionNumber', 'source', 'sourceUrl', 'notes', 'tags',
  ];
  const rows = artifacts.map((a) => headers.map((h) => csvCell(a[h])).join(','));
  // BOM so Excel opens the UTF-8 file with accents intact.
  return '﻿' + [headers.join(','), ...rows].join('\r\n');
}
