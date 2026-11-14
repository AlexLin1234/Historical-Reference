import type { NormalizedArtifact } from './artifact';

export interface SavedArtifact extends NormalizedArtifact {
  savedAt: string;
  notes: string;
  tags: string[];
  /** Manual override of the kit category used on documentation sheets. */
  kitSlot?: string;
}

/**
 * An "impression" is a reenactment persona / kit: a named portrayal with a
 * target date range, backed by the museum pieces that document it.
 */
export interface Impression {
  id: string;
  name: string;
  description: string;
  startYear: number | null;
  endYear: number | null;
  artifactIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SessionCollection {
  version: number;
  artifacts: SavedArtifact[];
  impressions: Impression[];
  createdAt: string;
  updatedAt: string;
}
