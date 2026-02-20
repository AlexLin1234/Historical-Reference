import type { NormalizedArtifact } from '@/types/artifact';

// Transformers.js pipeline type (simplified for our usage)
type Embedder = (text: string, options: { pooling: string; normalize: boolean }) => Promise<{ data: Float32Array }>;

// Singleton pipeline — downloaded once, cached in memory and by the browser
let instance: Embedder | null = null;
let loading: Promise<Embedder> | null = null;

async function getEmbedder(): Promise<Embedder> {
  if (instance) return instance;
  if (loading) return loading;

  loading = (async () => {
    const { pipeline } = await import('@xenova/transformers');
    // Quantized model is ~23 MB vs ~90 MB for full precision — acceptable accuracy tradeoff
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
    instance = extractor as unknown as Embedder;
    return instance;
  })();

  return loading;
}

function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}

function artifactToText(artifact: NormalizedArtifact): string {
  return [
    artifact.title,
    artifact.classification,
    artifact.objectType,
    artifact.medium,
    artifact.culture,
    artifact.artist,
    artifact.description,
  ]
    .filter(Boolean)
    .join('. ');
}

/**
 * Re-rank artifacts by semantic similarity to the query using a local sentence
 * embedding model (all-MiniLM-L6-v2 via Transformers.js / ONNX Runtime WASM).
 *
 * The model is downloaded once (~23 MB) and cached by the browser.
 * Subsequent calls within the same session are fast (~5-20 ms per embedding).
 */
export async function semanticRerank(
  artifacts: NormalizedArtifact[],
  query: string
): Promise<NormalizedArtifact[]> {
  if (artifacts.length === 0) return artifacts;

  const embed = await getEmbedder();

  // Embed query once, then all artifact texts in parallel (ONNX runtime queues them internally)
  const [queryOutput, ...artifactOutputs] = await Promise.all([
    embed(query, { pooling: 'mean', normalize: true }),
    ...artifacts.map((a) => embed(artifactToText(a), { pooling: 'mean', normalize: true })),
  ]);

  const queryVec = queryOutput.data;

  const scored = artifacts.map((artifact, i) => ({
    artifact,
    score: cosineSimilarity(queryVec, artifactOutputs[i].data),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.artifact);
}

/**
 * Kick off model download in the background so the first real search is faster.
 * Call this early (e.g. on page mount) to warm up the model.
 */
export function preloadSemanticModel(): void {
  getEmbedder().catch(() => {
    // Silently ignore preload failures — semantic re-ranking is best-effort
  });
}
