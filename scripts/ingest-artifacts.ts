#!/usr/bin/env node
/**
 * ingest-artifacts.ts
 *
 * Seeds the pgvector `artifacts` table used by semantic search. For each
 * reenactment topic below it searches every museum through the app's own
 * search code (so records are normalized exactly as the app shows them) and
 * posts them in batches to the `ingest-artifact` Edge Function, which embeds
 * and stores them. Re-running is safe: records are upserted by id.
 *
 * Environment (read from the shell, then .env.local / .env):
 *   NEXT_PUBLIC_SUPABASE_URL       your project URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  used to call the museum search functions
 *   INGEST_TOKEN                   bearer token for ingest-artifact: either the
 *                                  service-role key or a token whose SHA-256 is
 *                                  in public.ingest_tokens (see README)
 * Optional:
 *   INGEST_SOURCES     comma-separated museums (default: all)
 *   INGEST_PER_QUERY   results per topic per museum (default 15, max 50)
 *   INGEST_TOPICS      comma-separated topics to use instead of the list below
 *
 * Usage:
 *   npx tsx scripts/ingest-artifacts.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { MuseumSource, NormalizedArtifact } from '@/types/artifact';

for (const file of ['.env.local', '.env']) {
  try {
    for (const line of readFileSync(resolve(process.cwd(), file), 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      if (!(key in process.env)) {
        process.env[key] = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    // file absent
  }
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const TOKEN = process.env.INGEST_TOKEN ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
if (!SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !TOKEN) {
  console.error(
    'Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY and INGEST_TOKEN (or SUPABASE_SERVICE_ROLE_KEY).'
  );
  process.exit(1);
}

const INGEST_URL = `${SUPABASE_URL}/functions/v1/ingest-artifact`;
const BATCH = 6;
const PER_QUERY = Math.min(parseInt(process.env.INGEST_PER_QUERY ?? '15', 10) || 15, 50);

/** Things reenactors research, spread over periods and kit areas. */
const DEFAULT_TOPICS = [
  // arms and armour
  'helmet', 'sallet', 'bascinet', 'armour', 'breastplate', 'gauntlet', 'chain mail', 'shield',
  'sword', 'rapier', 'dagger', 'axe', 'halberd', 'spear', 'crossbow', 'longbow arrow',
  'musket', 'flintlock pistol', 'powder flask', 'bayonet', 'saber', 'cartridge box',
  // clothing
  'tunic', 'doublet', 'gown', 'bodice', 'cloak', 'hood', 'hat', 'cap', 'coif', 'shoe',
  'boot', 'stockings', 'shirt', 'waistcoat', 'military uniform', 'frock coat', 'apron',
  'glove', 'embroidery', 'woven textile',
  // small finds and accessories
  'brooch', 'buckle', 'belt', 'purse', 'pilgrim badge', 'ring', 'pendant', 'button',
  'comb', 'spur', 'horse harness',
  // camp and domestic
  'spoon', 'jug', 'tankard', 'bowl', 'cauldron', 'lantern', 'candlestick', 'chest',
  'knife', 'drinking horn', 'spindle whorl', 'scissors', 'dice', 'chess piece',
  // eras and cultures
  'viking', 'anglo-saxon', 'roman soldier', 'medieval knight', 'tudor', 'civil war soldier',
  'napoleonic', 'samurai armor',
];

const ALL_SOURCES: MuseumSource[] = ['met', 'va', 'cleveland', 'chicago', 'mia', 'europeana', 'harvard', 'smithsonian'];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Post a batch to ingest-artifact. Embedding is CPU-bound and an Edge
 * Function gets roughly two seconds of CPU per call, so a batch that hits the
 * limit (HTTP 546) is split in half and retried.
 */
async function post(artifacts: NormalizedArtifact[]): Promise<number> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(INGEST_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify({ artifacts }),
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      for (const e of json.errors ?? []) console.warn('   !', e);
      return json.ingested as number;
    }
    if (res.status === 401) throw new Error('ingest-artifact rejected the token (401)');
    if (res.status === 546 && artifacts.length > 1) {
      const half = Math.ceil(artifacts.length / 2);
      return (await post(artifacts.slice(0, half))) + (await post(artifacts.slice(half)));
    }
    if (attempt >= 3) {
      console.warn(`   ! dropped ${artifacts.map((a) => a.id).join(', ')} (${res.status})`);
      return 0;
    }
    await sleep(1500 * attempt);
  }
}

(async () => {
  // Imported after the environment is loaded: the client reads it on first use.
  const { searchOneSource } = await import('@/lib/api/search');

  const sources = (process.env.INGEST_SOURCES?.split(',').map((s) => s.trim()) ??
    ALL_SOURCES) as MuseumSource[];
  const topics = process.env.INGEST_TOPICS?.split(',').map((t) => t.trim()) ?? DEFAULT_TOPICS;

  console.log(`Seeding ${topics.length} topics × ${sources.length} museums, ${PER_QUERY} each`);

  const seen = new Set<string>();
  const pending: NormalizedArtifact[] = [];
  let stored = 0;
  const skipped = new Set<MuseumSource>();

  const flush = async () => {
    while (pending.length > 0) {
      const batch = pending.splice(0, BATCH);
      stored += await post(batch);
    }
  };

  for (const topic of topics) {
    let found = 0;
    for (const source of sources) {
      if (skipped.has(source)) continue;
      try {
        const result = await searchOneSource(source, topic, 1, PER_QUERY);
        for (const a of result.artifacts) {
          if (seen.has(a.id)) continue;
          seen.add(a.id);
          pending.push(a);
          found++;
        }
      } catch (err) {
        const msg = (err as Error).message;
        // A museum without a key, or over its limit, is skipped for the rest of the run.
        if (/not set up|demo limit|rate-limit/i.test(msg)) {
          console.warn(` - skipping ${source} for the rest of the run: ${msg}`);
          skipped.add(source);
        } else {
          console.warn(` - ${source} "${topic}": ${msg}`);
        }
      }
    }
    await flush();
    console.log(`${topic.padEnd(20)} +${String(found).padStart(3)}   total ${stored}`);
  }

  console.log(`\nDone: ${stored} artifacts indexed.`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
