'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { NormalizedArtifact, MuseumSource } from '@/types/artifact';
import { ArtifactDetail } from '@/components/artifact/ArtifactDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useCollection } from '@/hooks/useCollection';
import { refreshSavedArtifact } from '@/lib/storage';
import { getClevelandArtwork } from '@/lib/api/cleveland';
import { getVAObject } from '@/lib/api/va';
import { getMetObject } from '@/lib/api/met';
import { getSmithsonianItem } from '@/lib/api/smithsonian';
import { getHarvardObject } from '@/lib/api/harvard';
import { getChicagoArtwork } from '@/lib/api/chicago';
import { normalizeClevelandArtwork } from '@/lib/normalizers/cleveland';
import { normalizeVAObject } from '@/lib/normalizers/va';
import { normalizeMetObject } from '@/lib/normalizers/met';
import { normalizeSmithsonianItem } from '@/lib/normalizers/smithsonian';
import { normalizeHarvardObject } from '@/lib/normalizers/harvard';
import { normalizeChicagoArtwork } from '@/lib/normalizers/chicago';

function numericId(id: string): number {
  if (!/^\d+$/.test(id)) throw new Error('Artifact not found');
  return parseInt(id, 10);
}

const FETCHERS: Partial<Record<MuseumSource, (id: string) => Promise<NormalizedArtifact>>> = {
  cleveland: async (id) => normalizeClevelandArtwork(await getClevelandArtwork(id)),
  va: async (id) => normalizeVAObject(await getVAObject(id)),
  met: async (id) => normalizeMetObject(await getMetObject(numericId(id))),
  smithsonian: async (id) => normalizeSmithsonianItem((await getSmithsonianItem(id)).response),
  harvard: async (id) => normalizeHarvardObject(await getHarvardObject(numericId(id))),
  chicago: async (id) => {
    const resp = await getChicagoArtwork(numericId(id));
    return normalizeChicagoArtwork(resp.data, resp.config?.iiif_url);
  },
};

type Loaded = { key: string; artifact?: NormalizedArtifact; error?: string };

export default function ArtifactPage() {
  const params = useParams();
  const router = useRouter();
  const source = params.source as MuseumSource;
  const id = decodeURIComponent(params.id as string);
  const key = `${source}/${id}`;

  const { collection } = useCollection();
  // A saved copy shows instantly, works offline, and is the only copy there
  // is for scraped records.
  const saved = collection.artifacts.find((a) => a.source === source && a.sourceId === id);

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const fetcher = FETCHERS[source];

  useEffect(() => {
    if (!fetcher) return;
    let stale = false;
    fetcher(id)
      .then((artifact) => {
        if (stale) return;
        setLoaded({ key, artifact });
        refreshSavedArtifact(artifact);
      })
      .catch((err: Error) => {
        if (!stale) setLoaded({ key, error: err.message });
      });
    return () => {
      stale = true;
    };
  }, [fetcher, id, key]);

  const current = loaded?.key === key ? loaded : null;
  const artifact = current?.artifact ?? saved ?? null;
  const error = current?.error ?? (!fetcher && !saved ? 'This record is no longer available.' : null);
  const isLoading = !artifact && !error;

  const back = (
    <button
      onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}
      className="mb-6 flex items-center gap-2 text-steel hover:text-ink dark:text-steel-light dark:hover:text-parchment print:hidden"
    >
      <ArrowLeft size={20} />
      Back
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (!artifact) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        {back}
        <ErrorMessage message={error || 'Artifact not found'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {back}
      {error && saved && (
        <div className="mb-6">
          <ErrorMessage message={`Showing your saved copy. The museum record could not be refreshed: ${error}`} />
        </div>
      )}
      <ArtifactDetail key={artifact.id} artifact={artifact} />
    </div>
  );
}
