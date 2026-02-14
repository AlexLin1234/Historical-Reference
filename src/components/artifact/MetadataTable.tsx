import type { NormalizedArtifact } from '@/types/artifact';

interface MetadataTableProps {
  artifact: NormalizedArtifact;
}

export function MetadataTable({ artifact }: MetadataTableProps) {
  const rows = [
    { label: 'Date', value: artifact.date },
    { label: 'Artist', value: artifact.artist },
    { label: 'Artist Bio', value: artifact.artistBio },
    { label: 'Culture', value: artifact.culture },
    { label: 'Period', value: artifact.period },
    { label: 'Classification', value: artifact.classification },
    { label: 'Object Type', value: artifact.objectType },
    { label: 'Medium', value: artifact.medium },
    { label: 'Dimensions', value: artifact.dimensions },
    { label: 'Department', value: artifact.department },
    { label: 'Gallery', value: artifact.gallery },
    { label: 'Country', value: artifact.country },
    { label: 'Region', value: artifact.region },
    { label: 'Credit Line', value: artifact.creditLine },
  ].filter((row) => row.value);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Details</h2>
      <div className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-3 gap-4 px-4 py-3 text-sm"
          >
            <dt className="font-medium text-steel dark:text-steel-light">
              {row.label}
            </dt>
            <dd className="col-span-2">{row.value}</dd>
          </div>
        ))}
      </div>
    </div>
  );
}
