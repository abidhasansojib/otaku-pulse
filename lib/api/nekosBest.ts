const BASE_URL = 'https://nekos.best/api/v2';
const USER_AGENT = 'OtakuPulse/1.0 (https://otaku-pulse.vercel.app)';

export interface NekosBestResult {
  artist_name: string;
  artist_href: string;
  source_url: string;
  url: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface NekosBestResponse {
  results: NekosBestResult[];
}

export type NekosEndpointCategory = Record<string, { format: string }>;

/**
 * 1. Fetch random artwork from a specific category
 */
export async function getRandomArtworks(
  category: string = 'waifu',
  amount: number = 18
): Promise<NekosBestResult[]> {
  try {
    const validAmount = Math.min(amount, 20);
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(category)}?amount=${validAmount}`, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) throw new Error(`nekos.best API error: ${res.status}`);
    const data: NekosBestResponse = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to fetch from nekos.best:', err);
    return [];
  }
}

/**
 * 2. Search artwork and GIFs by metadata or query
 */
export async function searchArtworks(
  query: string,
  type: 1 | 2 = 1,
  amount: number = 18,
  category?: string
): Promise<NekosBestResult[]> {
  if (!query || !query.trim()) return [];
  try {
    const validAmount = Math.min(amount, 20);
    let url = `${BASE_URL}/search?query=${encodeURIComponent(query.trim())}&type=${type}&amount=${validAmount}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 300 },
    });

    if (!res.ok) throw new Error(`nekos.best Search error: ${res.status}`);
    const data: NekosBestResponse = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to search nekos.best:', err);
    return [];
  }
}

/**
 * 3. Fetch all available API categories
 */
export async function getAvailableCategories(): Promise<NekosEndpointCategory> {
  try {
    const res = await fetch(`${BASE_URL}/endpoints`, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: 86400 }, // Cache list for 24h
    });
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}
