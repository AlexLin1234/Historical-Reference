import type { NormalizedArtifact } from '@/types/artifact';

export function normalizeScrapeResult(
  markdown: string,
  sourceUrl: string,
  metadata: { title: string; description: string }
): Partial<NormalizedArtifact> {
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const images: string[] = [];
  let match;
  while ((match = imageRegex.exec(markdown)) !== null) {
    images.push(match[2]);
  }

  const extractField = (labels: string[]): string | null => {
    for (const label of labels) {
      const regex = new RegExp(`(?:^|\\n)\\**${label}\\**[:\\s]+(.+?)(?:\\n|$)`, 'i');
      const m = markdown.match(regex);
      if (m) return m[1].trim();
    }
    return null;
  };

  const id = `scraped-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    sourceId: id,
    source: 'scraped',
    title: metadata.title || extractField(['Title', 'Object', 'Name']) || 'Untitled',
    date: extractField(['Date', 'Period', 'Year', 'Created']) || '',
    dateEarliest: null,
    dateLatest: null,
    period: extractField(['Period', 'Era']) || null,
    culture: extractField(['Culture', 'Origin', 'Country']) || null,
    classification: extractField(['Classification', 'Type', 'Category', 'Object Type']) || null,
    objectType: extractField(['Object Type', 'Type']) || null,
    medium: extractField(['Medium', 'Materials', 'Material', 'Technique']) || null,
    dimensions: extractField(['Dimensions', 'Size', 'Measurements']) || null,
    artist: extractField(['Artist', 'Maker', 'Creator', 'Author']) || null,
    artistBio: null,
    description: metadata.description || extractField(['Description', 'About', 'Summary']) || null,
    primaryImage: images[0] || null,
    primaryImageSmall: images[0] || null,
    additionalImages: images.slice(1),
    department: extractField(['Department', 'Collection', 'Gallery']) || null,
    gallery: null,
    country: extractField(['Country', 'Place of Origin', 'Geography']) || null,
    region: null,
    creditLine: extractField(['Credit', 'Credit Line', 'Accession']) || null,
    sourceUrl,
    isPublicDomain: false,
  };
}
