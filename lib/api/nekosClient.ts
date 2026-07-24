export interface NekosImage {
  id: number | string;
  url: string;
  rating: 'safe' | 'suggestive' | 'erotica';
  color_dominant?: [number, number, number];
  color_palette?: [number, number, number][];
  artist_name?: string | null;
  tags?: string[];
  source_url?: string | null;
}

const NEKOS_BASE_URL = 'https://api.nekosapi.com/v4';

/**
 * Fetch Random Anime Wallpapers & Artworks from NekosAPI v4
 */
export async function fetchNekosWallpapers(
  rating: 'safe' | 'suggestive' = 'safe',
  limit: number = 24
): Promise<NekosImage[]> {
  try {
    const url = `${NEKOS_BASE_URL}/images/random?rating=${rating}&limit=${limit}`;
    const res = await fetch(url, { next: { revalidate: 300 } });

    if (!res.ok) {
      throw new Error(`NekosAPI response status: ${res.status}`);
    }

    const data = await res.json();
    if (Array.isArray(data)) {
      return data.filter((item: NekosImage) => item && item.url);
    }
  } catch (err) {
    console.error('Failed to fetch NekosAPI wallpapers:', err);
  }

  // High quality fallback wallpapers
  return [
    {
      id: 'fallback-1',
      url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920',
      rating: 'safe',
      artist_name: 'Anime Artist',
      tags: ['wallpaper', 'scenery', 'cyberpunk'],
    },
    {
      id: 'fallback-2',
      url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1920',
      rating: 'safe',
      artist_name: 'Digital Painter',
      tags: ['illustration', 'landscape'],
    },
    {
      id: 'fallback-3',
      url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920',
      rating: 'safe',
      artist_name: 'Concept Artist',
      tags: ['anime', 'night', 'stars'],
    },
  ];
}
