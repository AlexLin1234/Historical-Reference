import type { NormalizedArtifact } from './artifact';

export interface SavedArtifact extends NormalizedArtifact {
  savedAt: string;
  notes: string;
  tags: string[];
}

export interface SessionCollection {
  version: number;
  artifacts: SavedArtifact[];
  createdAt: string;
  updatedAt: string;
}

export type SortField = 'savedAt' | 'title' | 'dateEarliest' | 'source';
export type SortDirection = 'asc' | 'desc';

export interface CollectionFilters {
  category: string | null;
  period: string | null;
  source: string | null;
  sortBy: SortField;
  sortDirection: SortDirection;
}
