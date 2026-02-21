#!/usr/bin/env node
/**
 * ingest-artifacts.ts
 *
 * Seeds the Supabase pgvector `artifacts` table by fetching a sample of
 * artifacts from each museum's public API, normalizing them, and posting
 * batches to the `ingest-artifact` Edge Function.
 *
 * Prerequisites:
 *   npm install -g tsx          (or: npx tsx scripts/ingest-artifacts.ts)
 *
 * Required environment variables (create a .env.local or export them):
 *   NEXT_PUBLIC_SUPABASE_URL        e.g. https://xxxx.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY       found in Supabase dashboard > Settings > API
 *
 * Optional:
 *   INGEST_LIMIT_PER_SOURCE   number of artifacts to fetch per museum (default 200)
 *   INGEST_BATCH_SIZE         artifacts per ingest request (default 25, max 50)
 *
 * Usage:
 *   npx tsx scripts/ingest-artifacts.ts
 *   INGEST_LIMIT_PER_SOURCE=500 npx tsx scripts/ingest-artifacts.ts
 */

import { config } from 'dotenv';

// Load .env.local then .env
config({ path: '.env.local' });
config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
const LIMIT_PER_SOURCE = parseInt(process.env.INGEST_LIMIT_PER_SOURCE ?? '200', 10);
const BATCH_SIZE = Math.min(parseInt(process.env.INGEST_BATCH_SIZE ?? '25', 10), 50);

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Error: Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
  );
  process.exit(1);
}

const INGEST_URL = `${SUPABASE_URL}/functions/v1/ingest-artifact`;

// ── Types ─────────────────────────────────────────────────────────────────────

interface NormalizedArtifact {
  id: string;
  sourceId: string;
  source: string;
  title: string;
  date: string;
  dateEarliest: number | null;
  dateLatest: number | null;
  period: string | null;
  culture: string | null;
  classification: string | null;
  objectType: string | null;
  medium: string | null;
  dimensions: string | null;
  artist: string | null;
  artistBio: string | null;
  description: string | null;
  primaryImage: string | null;
  primaryImageSmall: string | null;
  additionalImages: string[];
  department: string | null;
  gallery: string | null;
  country: string | null;
  region: string | null;
  creditLine: string | null;
  sourceUrl: string;
  isPublicDomain: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postBatch(artifacts: NormalizedArtifact[]): Promise<void> {
  const res = await fetch(INGEST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ artifacts }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(
      `Ingest failed (${res.status}): ${json?.error ?? res.statusText}`
    );
  }

  if (json.errors?.length) {
    for (const e of json.errors) console.warn('  ⚠ ', e);
  }
}

async function ingestAll(artifacts: NormalizedArtifact[], sourceName: string) {
  console.log(`  Ingesting ${artifacts.length} ${sourceName} artifacts in batches of ${BATCH_SIZE}…`);
  let ingested = 0;

  for (let i = 0; i < artifacts.length; i += BATCH_SIZE) {
    const batch = artifacts.slice(i, i + BATCH_SIZE);
    await postBatch(batch);
    ingested += batch.length;
    process.stdout.write(`\r  ${ingested}/${artifacts.length} done`);
    // Small delay to avoid hammering the Edge Function
    if (i + BATCH_SIZE < artifacts.length) await sleep(500);
  }
  console.log(`\r  ✓ ${ingested} ${sourceName} artifacts indexed`);
}

// ── Museum fetchers ───────────────────────────────────────────────────────────

// Metropolitan Museum of Art
async function fetchMet(limit: number): Promise<NormalizedArtifact[]> {
  const searchRes = await fetch(
    'https://collectionapi.metmuseum.org/public/collection/v1/search?' +
      new URLSearchParams({ q: 'armor OR weapon OR textile OR sword', hasImages: 'true' })
  );
  const { objectIDs = [] } = await searchRes.json();
  const ids: number[] = objectIDs.slice(0, limit);

  const artifacts: NormalizedArtifact[] = [];
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    const results = await Promise.allSettled(
      batch.map((id) =>
        fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`)
          .then((r) => r.json())
      )
    );
    for (const r of results) {
      if (r.status !== 'fulfilled' || !r.value?.objectID) continue;
      const o = r.value;
      artifacts.push({
        id: `met-${o.objectID}`,
        sourceId: String(o.objectID),
        source: 'met',
        title: o.title || 'Untitled',
        date: o.objectDate || '',
        dateEarliest: o.objectBeginDate ?? null,
        dateLatest: o.objectEndDate ?? null,
        period: o.period || null,
        culture: o.culture || null,
        classification: o.classification || null,
        objectType: o.objectName || null,
        medium: o.medium || null,
        dimensions: o.dimensions || null,
        artist: o.artistDisplayName || null,
        artistBio: o.artistDisplayBio || null,
        description: null,
        primaryImage: o.primaryImage || null,
        primaryImageSmall: o.primaryImageSmall || null,
        additionalImages: o.additionalImages || [],
        department: o.department || null,
        gallery: o.GalleryNumber || null,
        country: o.country || null,
        region: o.region || null,
        creditLine: o.creditLine || null,
        sourceUrl: o.objectURL || `https://www.metmuseum.org/art/collection/search/${o.objectID}`,
        isPublicDomain: Boolean(o.isPublicDomain),
      });
    }
    await sleep(200);
  }
  return artifacts;
}

// Victoria & Albert Museum
async function fetchVA(limit: number): Promise<NormalizedArtifact[]> {
  const pageSize = Math.min(limit, 100);
  const res = await fetch(
    `https://api.vam.ac.uk/v2/objects/search?q=armour+weapon+textile&page_size=${pageSize}&images_exist=1`
  );
  const data = await res.json();
  const records: Record<string, unknown>[] = data.records || [];

  return records.slice(0, limit).map((r: Record<string, unknown>) => {
    const systemNumber = r.systemNumber as string;
    const image = r._images as Record<string, unknown> | null;
    return {
      id: `va-${systemNumber}`,
      sourceId: systemNumber,
      source: 'va',
      title: (r._primaryTitle as string) || 'Untitled',
      date: (r._primaryDate as string) || '',
      dateEarliest: null,
      dateLatest: null,
      period: null,
      culture: null,
      classification: (r.objectType as string) || null,
      objectType: (r.objectType as string) || null,
      medium: null,
      dimensions: null,
      artist: (r._primaryMaker as Record<string, unknown>)?.name as string || null,
      artistBio: null,
      description: null,
      primaryImage: image?._primary_thumbnail as string || null,
      primaryImageSmall: image?._primary_thumbnail as string || null,
      additionalImages: [],
      department: null,
      gallery: null,
      country: null,
      region: null,
      creditLine: null,
      sourceUrl: `https://collections.vam.ac.uk/item/${systemNumber}`,
      isPublicDomain: true,
    };
  });
}

// Cleveland Museum of Art
async function fetchCleveland(limit: number): Promise<NormalizedArtifact[]> {
  const res = await fetch(
    `https://openaccess-api.clevelandart.org/api/artworks/?limit=${Math.min(limit, 100)}&has_image=1&type=armor,weapon,textile`
  );
  const data = await res.json();
  const items: Record<string, unknown>[] = data.data || [];

  return items.slice(0, limit).map((o: Record<string, unknown>) => {
    const images = o.images as Record<string, Record<string, string>> | null;
    return {
      id: `cleveland-${o.id}`,
      sourceId: String(o.id),
      source: 'cleveland',
      title: (o.title as string) || 'Untitled',
      date: (o.creation_date as string) || '',
      dateEarliest: (o.creation_date_earliest as number) ?? null,
      dateLatest: (o.creation_date_latest as number) ?? null,
      period: null,
      culture: (o.culture as string) || null,
      classification: (o.type as string) || null,
      objectType: (o.type as string) || null,
      medium: (o.technique as string) || null,
      dimensions: (o.dimensions as string) || null,
      artist: ((o.creators as Record<string, unknown>[])?.[0]?.description as string) || null,
      artistBio: null,
      description: (o.description as string) || null,
      primaryImage: images?.web?.url || null,
      primaryImageSmall: images?.print?.url || null,
      additionalImages: [],
      department: (o.department as string) || null,
      gallery: null,
      country: null,
      region: null,
      creditLine: (o.creditline as string) || null,
      sourceUrl: (o.url as string) || `https://www.clevelandart.org/art/${o.id}`,
      isPublicDomain: Boolean(o.share_license_status === 'CC0'),
    };
  });
}

// Art Institute of Chicago
async function fetchChicago(limit: number): Promise<NormalizedArtifact[]> {
  const res = await fetch(
    `https://api.artic.edu/api/v1/artworks/search?q=armor+weapon+textile&limit=${Math.min(limit, 100)}&fields=id,title,date_display,date_start,date_end,place_of_origin,medium_display,dimensions,artist_display,image_id,artwork_type_title,department_title,description,is_public_domain,api_link`
  );
  const data = await res.json();
  const items: Record<string, unknown>[] = data.data || [];
  const iiifBase = data.config?.iiif_url || 'https://www.artic.edu/iiif/2';

  return items.slice(0, limit).map((o: Record<string, unknown>) => {
    const imageId = o.image_id as string | null;
    const primaryImage = imageId ? `${iiifBase}/${imageId}/full/843,/0/default.jpg` : null;
    const primaryImageSmall = imageId ? `${iiifBase}/${imageId}/full/400,/0/default.jpg` : null;
    return {
      id: `chicago-${o.id}`,
      sourceId: String(o.id),
      source: 'chicago',
      title: (o.title as string) || 'Untitled',
      date: (o.date_display as string) || '',
      dateEarliest: (o.date_start as number) ?? null,
      dateLatest: (o.date_end as number) ?? null,
      period: null,
      culture: (o.place_of_origin as string) || null,
      classification: (o.artwork_type_title as string) || null,
      objectType: (o.artwork_type_title as string) || null,
      medium: (o.medium_display as string) || null,
      dimensions: (o.dimensions as string) || null,
      artist: (o.artist_display as string) || null,
      artistBio: null,
      description: (o.description as string) || null,
      primaryImage,
      primaryImageSmall,
      additionalImages: [],
      department: (o.department_title as string) || null,
      gallery: null,
      country: (o.place_of_origin as string) || null,
      region: null,
      creditLine: null,
      sourceUrl: (o.api_link as string) || `https://www.artic.edu/artworks/${o.id}`,
      isPublicDomain: Boolean(o.is_public_domain),
    };
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

const SOURCES: Array<{
  name: string;
  fetch: (limit: number) => Promise<NormalizedArtifact[]>;
}> = [
  { name: 'Metropolitan Museum of Art', fetch: fetchMet },
  { name: 'Victoria & Albert Museum', fetch: fetchVA },
  { name: 'Cleveland Museum of Art', fetch: fetchCleveland },
  { name: 'Art Institute of Chicago', fetch: fetchChicago },
];

(async () => {
  console.log('🏛  Reenactor\'s Reference — artifact ingestion script');
  console.log(`   Supabase URL : ${SUPABASE_URL}`);
  console.log(`   Limit/source : ${LIMIT_PER_SOURCE}`);
  console.log(`   Batch size   : ${BATCH_SIZE}`);
  console.log('');

  let totalIngested = 0;

  for (const { name, fetch: fetchFn } of SOURCES) {
    console.log(`\n📦 ${name}`);
    try {
      console.log(`  Fetching up to ${LIMIT_PER_SOURCE} artifacts…`);
      const artifacts = await fetchFn(LIMIT_PER_SOURCE);
      console.log(`  Fetched ${artifacts.length} artifacts`);

      if (artifacts.length > 0) {
        await ingestAll(artifacts, name);
        totalIngested += artifacts.length;
      }
    } catch (err) {
      console.error(`  ✗ Error ingesting ${name}: ${(err as Error).message}`);
    }
  }

  console.log(`\n✅ Done. ${totalIngested} total artifacts indexed in Supabase.`);
  console.log('   Run searches in the app — vector search is now active.');
})();
