import type { SavedArtifact } from '@/types/collection';
import { CollectionItem } from './CollectionItem';

interface CollectionListProps {
  artifacts: SavedArtifact[];
}

export function CollectionList({ artifacts }: CollectionListProps) {
  // Group by category
  const grouped = artifacts.reduce((acc, artifact) => {
    const category = artifact.classification || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(artifact);
    return acc;
  }, {} as Record<string, SavedArtifact[]>);

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h2 className="mb-4 text-xl font-semibold">
            {category} ({items.length})
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((artifact) => (
              <CollectionItem key={artifact.id} artifact={artifact} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
