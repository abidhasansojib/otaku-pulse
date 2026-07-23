import { AnimeItem } from '../types/anime';
import { mapAniListToAnimeItem } from './anilistClient';

export async function searchAniListByGenre(genreName: string, page: number = 1): Promise<AnimeItem[]> {
  const query = `
    query ($genre: String, $page: Int) {
      Page(page: $page, perPage: 24) {
        media(genre: $genre, type: ANIME, sort: SCORE_DESC) {
          id
          idMal
          title { romaji english native }
          coverImage { extraLarge large medium }
          bannerImage
          startDate { year month day }
          description
          seasonYear
          season
          format
          status
          episodes
          averageScore
          popularity
          genres
          trailer { id site thumbnail }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ query, variables: { genre: genreName, page } })
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}`);
    }

    const json = await res.json();
    const mediaList = json?.data?.Page?.media || [];
    return mediaList.map(mapAniListToAnimeItem);
  } catch (err) {
    console.error('[searchAniListByGenre] AniList fallback failed:', err);
    return [];
  }
}
