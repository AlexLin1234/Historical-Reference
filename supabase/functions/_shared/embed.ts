// Text embedding with Supabase AI's built-in gte-small model (384 dims).
// Shared by ingest-artifact (documents) and vector-search (queries) so both
// sides of the comparison use exactly the same model and settings.

declare const Supabase: {
  ai: {
    Session: new (model: string) => {
      run: (
        text: string,
        options: { mean_pool: boolean; normalize: boolean }
      ) => Promise<number[] | Float32Array>;
    };
  };
};

let session: InstanceType<typeof Supabase.ai.Session> | null = null;

export async function embed(text: string): Promise<number[]> {
  // Created once per worker: loading the model is the slow part.
  session ??= new Supabase.ai.Session('gte-small');
  const output = await session.run(text, { mean_pool: true, normalize: true });
  return Array.from(output);
}

/** gte-small reads at most 512 tokens; keep documents comfortably inside. */
const MAX_CHARS = 1500;

/**
 * The text embedded for an artifact: what it is first, then when, where and
 * what it is made of, then the description.
 */
export function artifactText(a: Record<string, unknown>): string {
  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  const parts = [
    str(a.title),
    str(a.objectType) !== str(a.title) ? str(a.objectType) : null,
    str(a.classification),
    str(a.date),
    str(a.culture) ?? str(a.country),
    str(a.period),
    str(a.medium),
    str(a.artist),
    str(a.description),
  ].filter((p): p is string => p !== null);
  return [...new Set(parts)].join('. ').slice(0, MAX_CHARS);
}
