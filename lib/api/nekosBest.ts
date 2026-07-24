const BASE_URL = 'https://nekos.best/api/v2';

export interface NekosBestResult {
  artist_name: string;
  artist_href: string;
  source_url: string;
  url: string;
  dimensions?: { width: number; height: number };
}

export interface NekosBestResponse {
  results: NekosBestResult[];
}

export type NekosEndpointCategory = Record<string, { format: string }>;

/**
 * Browser-safe fetcher (works on both Server and Client)
 */
export async function getRandomArtworks(category: string = 'waifu', amount: number = 18): Promise<NekosBestResult[]> {
  try {
    const validAmount = Math.min(amount, 20);
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(category)}?amount=${validAmount}`, {
      cache: 'no-store'
    });

    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    const data: NekosBestResponse = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to fetch wallpapers:', err);
    return [];
  }
}

export async function searchArtworks(query: string, type: 1 | 2 = 1, amount: number = 18, category?: string): Promise<NekosBestResult[]> {
  if (!query || !query.trim()) return [];
  try {
    const validAmount = Math.min(amount, 20);
    let url = `${BASE_URL}/search?query=${encodeURIComponent(query.trim())}&type=${type}&amount=${validAmount}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Search Error ${res.status}`);
    const data: NekosBestResponse = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to search wallpapers:', err);
    return [];
  }
}

export async function getAvailableCategories(): Promise<NekosEndpointCategory> {
  try {
    const res = await fetch(`${BASE_URL}/endpoints`, { cache: 'no-store' });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
