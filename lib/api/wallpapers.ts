export interface WallpaperItem {
  id: string;
  url: string;
  width?: number;
  height?: number;
  dominantColor?: string;
  source?: string;
  tags?: string[];
}

// 1. Primary Engine: Waifu.im API
export async function getAnimeWallpapers(tag: string = 'waifu', limit: number = 20): Promise<WallpaperItem[]> {
  const normalizedTag = tag.toLowerCase().trim().replace(/\s+/g, '-');

  try {
    const response = await fetch(
      `https://api.waifu.im/search?included_tags=${encodeURIComponent(normalizedTag)}&is_nsfw=false&limit=${limit}`,
      { cache: 'no-store' }
    );

    if (!response.ok) throw new Error(`Waifu.im error: ${response.status}`);
    const data = await response.json();

    if (data.images && data.images.length > 0) {
      return data.images.map((img: any) => ({
        id: String(img.image_id),
        url: img.url,
        width: img.width,
        height: img.height,
        dominantColor: img.dominant_color,
        source: img.source,
        tags: img.tags?.map((t: any) => t.name) || [tag],
      }));
    }
  } catch (error) {
    console.warn('Waifu.im failed, switching to Waifu.pics fallback:', error);
  }

  // 2. Fallback Engine: Waifu.pics API
  return fetchFallbackWallpapers(normalizedTag, limit);
}

async function fetchFallbackWallpapers(category: string, limit: number): Promise<WallpaperItem[]> {
  try {
    const validCategories = ['waifu', 'neko', 'shinobu', 'megumin'];
    const validCategory = validCategories.includes(category) ? category : 'waifu';
    const res = await fetch(`https://api.waifu.pics/many/sfw/${validCategory}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.files || []).slice(0, limit).map((url: string, idx: number) => ({
      id: `fallback-${idx}-${Date.now()}`,
      url,
      tags: [validCategory],
    }));
  } catch {
    return [];
  }
}
