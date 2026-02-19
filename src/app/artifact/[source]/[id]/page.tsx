'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import type { NormalizedArtifact, MuseumSource } from '@/types/artifact';
import { ArtifactDetail } from '@/components/artifact/ArtifactDetail';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
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

export default function ArtifactPage() {
  const params = useParams();
  const router = useRouter();
  const source = params.source as MuseumSource;
  const id = params.id as string;

  const [artifact, setArtifact] = useState<NormalizedArtifact | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArtifact() {
      setIsLoading(true);
      setError(null);

      try {
        let normalized: NormalizedArtifact;

        if (source === 'cleveland') {
          const data = await getClevelandArtwork(id);
          normalized = normalizeClevelandArtwork(data);
        } else if (source === 'va') {
          const data = await getVAObject(id);
          normalized = normalizeVAObject(data);
        } else if (source === 'met') {
          const data = await getMetObject(parseInt(id));
          normalized = normalizeMetObject(data);
        } else if (source === 'smithsonian') {
          const data = await getSmithsonianItem(id);
          normalized = normalizeSmithsonianItem(data.response);
        } else if (source === 'harvard') {
          const data = await getHarvardObject(parseInt(id));
          normalized = normalizeHarvardObject(data);
        } else if (source === 'chicago') {
          const resp = await getChicagoArtwork(parseInt(id));
          normalized = normalizeChicagoArtwork(resp.data, resp.config?.iiif_url);
        } else {
          throw new Error('Unsupported source');
        }

        setArtifact(normalized);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchArtifact();
  }, [source, id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-steel hover:text-ink dark:text-steel-light dark:hover:text-parchment"
        >
          <ArrowLeft size={20} />
          Back to results
        </button>
        <ErrorMessage message={error || 'Artifact not found'} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-2 text-steel hover:text-ink dark:text-steel-light dark:hover:text-parchment"
      >
        <ArrowLeft size={20} />
        Back to results
      </button>

      <ArtifactDetail artifact={artifact} />
    </div>
  );
}
