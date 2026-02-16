const SMITHSONIAN_API_KEY = process.env.NEXT_PUBLIC_SMITHSONIAN_API_KEY || 'DEMO_KEY';

interface SmithsonianSearchParams {
  query: string;
  rows?: number;
  start?: number;
  online_media_only?: boolean;
}

interface SmithsonianSearchResponse {
  rowCount: number;
  rows: Array<{
    id: string;
    title: string;
    unitCode: string;
    content?: {
      descriptiveNonRepeating?: {
        title?: { content?: string };
        metadata_usage?: { access?: string };
        online_media?: {
          media?: Array<{
            thumbnail?: string;
            idsId?: string;
            type?: string;
          }>;
        };
      };
      freetext?: {
        date?: Array<{ content?: string }>;
        objectType?: Array<{ content?: string }>;
        physicalDescription?: Array<{ content?: string }>;
        dataSource?: Array<{ content?: string }>;
      };
      indexedStructured?: {
        date?: string[];
        object_type?: string[];
        place?: string[];
        topic?: string[];
      };
    };
  }>;
}

export async function searchSmithsonian(params: SmithsonianSearchParams): Promise<SmithsonianSearchResponse> {
  const searchParams = new URLSearchParams({
    q: params.query,
    rows: String(params.rows || 20),
    start: String(params.start || 0),
  });

  if (params.online_media_only) {
    searchParams.append('online_media_type', 'Images');
  }

  const response = await fetch(
    `https://api.si.edu/openaccess/api/v1.0/search?${searchParams.toString()}&api_key=${SMITHSONIAN_API_KEY}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Smithsonian API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.response;
}

export async function getSmithsonianItem(itemId: string) {
  const response = await fetch(
    `https://api.si.edu/openaccess/api/v1.0/content/${itemId}?api_key=${SMITHSONIAN_API_KEY}`,
    {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (!response.ok) {
    throw new Error(`Smithsonian API error: ${response.statusText}`);
  }

  return response.json();
}
