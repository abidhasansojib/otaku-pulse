export interface NekosImage {
  id: number | string;
  title?: string;
  url: string;
  thumbnail_url?: string;
  rating: 'safe' | 'suggestive' | 'erotica' | 'borderline' | string;
  type?: 'banner' | 'poster' | 'artwork';
  artist_name?: string | null;
  tags?: string[];
  anime_id?: number;
  source_url?: string | null;
}

/**
 * Fetch Genuine High-Resolution Anime Wallpapers & Artworks from AniList GraphQL + NekosAPI
 */
export async function fetchNekosWallpapers(
  rating: 'safe' | 'suggestive' = 'safe',
  limit: number = 24,
  page: number = 1
): Promise<NekosImage[]> {
  const wallpapers: NekosImage[] = [];

  // 1. Fetch Official High-Res Anime Wallpapers & Key Visuals from AniList GraphQL
  try {
    const randomPage = Math.floor(Math.random() * 5) + 1;
    const query = `
      query ($page: Int, $perPage: Int) {
        Page(page: $page, perPage: $perPage) {
          media(type: ANIME, sort: [POPULARITY_DESC, SCORE_DESC], isAdult: false) {
            id
            title {
              userPreferred
              english
            }
            bannerImage
            coverImage {
              extraLarge
              large
            }
            genres
            siteUrl
          }
        }
      }
    `;

    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { page: randomPage, perPage: limit },
      }),
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const json = await res.json();
      const mediaList = json?.data?.Page?.media;

      if (Array.isArray(mediaList)) {
        mediaList.forEach((item: any) => {
          const animeTitle = item.title?.english || item.title?.userPreferred || 'Anime';

          // Add Official HD Banner Wallpaper
          if (item.bannerImage) {
            wallpapers.push({
              id: `anilist-banner-${item.id}`,
              title: `${animeTitle} — Official HD Banner Wallpaper`,
              url: item.bannerImage,
              thumbnail_url: item.bannerImage,
              rating: 'safe',
              type: 'banner',
              artist_name: 'Official Animation Studio',
              tags: item.genres || ['Anime', 'Wallpaper'],
              anime_id: item.id,
              source_url: item.siteUrl,
            });
          }

          // Add Extra Large Cover Poster Artwork
          if (item.coverImage?.extraLarge) {
            wallpapers.push({
              id: `anilist-cover-${item.id}`,
              title: `${animeTitle} — Official Visual Poster`,
              url: item.coverImage.extraLarge,
              thumbnail_url: item.coverImage.large || item.coverImage.extraLarge,
              rating: 'safe',
              type: 'poster',
              artist_name: 'Official Key Visual',
              tags: item.genres || ['Anime', 'Poster'],
              anime_id: item.id,
              source_url: item.siteUrl,
            });
          }
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch AniList anime wallpapers:', err);
  }

  // 2. Query NekosAPI for extra anime illustrations
  try {
    const nekosRes = await fetch(
      `https://api.nekosapi.com/v4/images/random?rating=${rating}&limit=12`,
      { cache: 'no-store' }
    );
    if (nekosRes.ok) {
      const nekosData = await nekosRes.json();
      if (Array.isArray(nekosData)) {
        nekosData.forEach((img: any, idx: number) => {
          if (img.url) {
            wallpapers.push({
              id: `nekos-${img.id || idx}`,
              title: `Anime Character Illustration #${idx + 1}`,
              url: img.url,
              thumbnail_url: img.sample_url || img.url,
              rating: img.rating || rating,
              type: 'artwork',
              artist_name: img.artist_name || 'Anime Illustrator',
              tags: Array.isArray(img.tags)
                ? img.tags.map((t: any) => (typeof t === 'string' ? t : t.name || 'anime'))
                : ['Anime', 'Artwork'],
              source_url: img.source_url || null,
            });
          }
        });
      }
    }
  } catch (e) {
    // Silent catch
  }

  // Shuffle & Deduplicate wallpapers
  const seen = new Set<string>();
  const unique = wallpapers.filter((item) => {
    if (!item.url || seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  return unique.sort(() => Math.random() - 0.5).slice(0, limit);
}
