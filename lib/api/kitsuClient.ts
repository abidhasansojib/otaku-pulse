/**
 * Kitsu API & AniList Banner Fallback Helper
 * Retrieves high resolution horizontal cover/banner artwork when MyAnimeList/Jikan high-res art is missing or low-res.
 */

const bannerCache = new Map<string, string | null>();

export async function fetchAnimeBanner(title: string): Promise<string | null> {
  if (!title) return null;
  const cleanTitle = title.trim().toLowerCase();

  if (bannerCache.has(cleanTitle)) {
    return bannerCache.get(cleanTitle)!;
  }

  try {
    // Attempt Kitsu API first
    const kitsuUrl = `https://kitsu.io/api/edge/anime?filter[text]=${encodeURIComponent(cleanTitle)}&page[limit]=1`;
    const res = await fetch(kitsuUrl);
    
    if (res.ok) {
      const json = await res.json();
      const firstResult = json?.data?.[0];
      const coverImage = firstResult?.attributes?.coverImage?.original || 
                         firstResult?.attributes?.coverImage?.large ||
                         firstResult?.attributes?.posterImage?.original;

      if (coverImage) {
        bannerCache.set(cleanTitle, coverImage);
        return coverImage;
      }
    }
  } catch (err) {
    console.warn(`[Kitsu Banner Fetch Failed for ${title}]:`, err);
  }

  try {
    // AniList GraphQL Fallback
    const query = `
      query ($search: String) {
        Media (search: $search, type: ANIME) {
          bannerImage
          coverImage {
            extraLarge
            large
          }
        }
      }
    `;

    const aniRes = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        query,
        variables: { search: cleanTitle },
      }),
    });

    if (aniRes.ok) {
      const aniJson = await aniRes.json();
      const media = aniJson?.data?.Media;
      const banner = media?.bannerImage || media?.coverImage?.extraLarge || media?.coverImage?.large;
      if (banner) {
        bannerCache.set(cleanTitle, banner);
        return banner;
      }
    }
  } catch (err) {
    console.warn(`[AniList Banner Fetch Failed for ${title}]:`, err);
  }

  bannerCache.set(cleanTitle, null);
  return null;
}
