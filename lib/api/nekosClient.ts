export interface NekosImage {
  id: number | string;
  url: string;
  rating: 'safe' | 'suggestive' | 'erotica' | 'borderline' | string;
  color_dominant?: [number, number, number];
  color_palette?: [number, number, number][];
  artist_name?: string | null;
  tags?: string[];
  source_url?: string | null;
}

const NEKOS_BASE_URL = 'https://api.nekosapi.com/v4';

const RICH_WALLPAPER_FALLBACKS: NekosImage[] = [
  { id: 'fb-1', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920', rating: 'safe', artist_name: 'Anime Visuals', tags: ['cyberpunk', 'city', 'night'] },
  { id: 'fb-2', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1920', rating: 'safe', artist_name: 'Digital Art', tags: ['illustration', 'landscape'] },
  { id: 'fb-3', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920', rating: 'safe', artist_name: 'Concept Art', tags: ['scenery', 'stars', 'night'] },
  { id: 'fb-4', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=1920', rating: 'safe', artist_name: 'Neon Master', tags: ['neon', 'glowing'] },
  { id: 'fb-5', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920', rating: 'safe', artist_name: 'Fantasy World', tags: ['fantasy', 'magic'] },
  { id: 'fb-6', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920', rating: 'safe', artist_name: 'Starry Sky', tags: ['mountains', 'galaxy'] },
  { id: 'fb-7', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920', rating: 'safe', artist_name: 'Ocean Breeze', tags: ['beach', 'sunset'] },
  { id: 'fb-8', url: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?q=80&w=1920', rating: 'safe', artist_name: 'Metropolis', tags: ['tokyo', 'cityscape'] },
  { id: 'fb-9', url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1920', rating: 'safe', artist_name: 'Matrix Code', tags: ['hacker', 'sci-fi'] },
  { id: 'fb-10', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920', rating: 'safe', artist_name: 'Abstract Color', tags: ['abstract', 'gradient'] },
  { id: 'fb-11', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?q=80&w=1920', rating: 'safe', artist_name: 'Oil Painting', tags: ['artwork', 'portrait'] },
  { id: 'fb-12', url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=1920', rating: 'safe', artist_name: 'Vibrant Flow', tags: ['fluid', 'art'] },
  { id: 'fb-13', url: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?q=80&w=1920', rating: 'safe', artist_name: 'Blue Horizon', tags: ['sea', 'sky'] },
  { id: 'fb-14', url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?q=80&w=1920', rating: 'safe', artist_name: 'Festive Lights', tags: ['celebration', 'glow'] },
  { id: 'fb-15', url: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1920', rating: 'safe', artist_name: 'Nature Serenity', tags: ['forest', 'autumn'] },
  { id: 'fb-16', url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1920', rating: 'safe', artist_name: 'Gaming Realm', tags: ['cyber', 'gaming'] },
  { id: 'fb-17', url: 'https://images.unsplash.com/photo-1511447333015-45b65e60f6d5?q=80&w=1920', rating: 'safe', artist_name: 'Purple Nebula', tags: ['cosmos', 'space'] },
  { id: 'fb-18', url: 'https://images.unsplash.com/photo-1550684847-75bdda21cc95?q=80&w=1920', rating: 'safe', artist_name: 'Synthwave Sun', tags: ['retro', '80s'] },
  { id: 'fb-19', url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=1920', rating: 'safe', artist_name: 'Mountain Peak', tags: ['snow', 'adventure'] },
  { id: 'fb-20', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920', rating: 'safe', artist_name: 'Sakura Petals', tags: ['japan', 'cherry_blossom'] },
  { id: 'fb-21', url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1920', rating: 'safe', artist_name: 'Cosmic Dust', tags: ['astronomy', 'night'] },
  { id: 'fb-22', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920', rating: 'safe', artist_name: 'Aurora Borealis', tags: ['aurora', 'lights'] },
  { id: 'fb-[#FF2A5F]', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=1920', rating: 'safe', artist_name: 'Anime Landscape', tags: ['shrine', 'torii'] },
  { id: 'fb-24', url: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1920', rating: 'safe', artist_name: 'Cyberpunk Tokyo', tags: ['shinjuku', 'rain'] },
];

/**
 * Fetch Random Anime Wallpapers & Artworks from NekosAPI v4
 */
export async function fetchNekosWallpapers(
  rating: 'safe' | 'suggestive' = 'safe',
  limit: number = 24
): Promise<NekosImage[]> {
  try {
    const url = `${NEKOS_BASE_URL}/images/random?rating=${rating}&limit=${limit}`;
    const res = await fetch(url, { cache: 'no-store' });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const formatted: NekosImage[] = data.map((item: any, idx: number) => ({
          id: item.id || `nekos-${idx}`,
          url: item.url || item.sample_url || item.thumbnail_url,
          rating: item.rating || rating,
          artist_name: item.artist_name || item.artist?.name || 'Anime Artist',
          tags: Array.isArray(item.tags)
            ? item.tags.map((t: any) => (typeof t === 'string' ? t : t.name || 'anime'))
            : ['artwork', 'anime'],
          source_url: item.source_url || null,
        }));

        if (formatted.length >= 8) {
          return formatted;
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch NekosAPI wallpapers:', err);
  }

  // Return full 24-item rich wallpaper collection if NekosAPI is throttled
  return RICH_WALLPAPER_FALLBACKS;
}
