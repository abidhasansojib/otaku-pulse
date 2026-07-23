export interface AniListAnime {
  id: number;
  idMal: number;
  title: {
    romaji: string;
    english: string | null;
  };
  coverImage: {
    extraLarge: string;
    large: string;
  };
  bannerImage: string | null;
  averageScore: number;
  episodes: number | null;
  genres: string[];
  status: string;
  seasonYear: number | null;
}

export async function getAnimeByGenreAniList(genreName: string, page: number = 1, perPage: number = 24): Promise<AniListAnime[]> {
  const query = `
    query ($genre: String, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        media(genre: $genre, type: ANIME, sort: SCORE_DESC) {
          id
          idMal
          title {
            romaji
            english
          }
          coverImage {
            extraLarge
            large
          }
          bannerImage
          averageScore
          episodes
          genres
          status
          seasonYear
        }
      }
    }
  `;

  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables: {
        genre: genreName,
        page,
        perPage,
      },
    }),
    next: { revalidate: 3600 }, // Cache responses for 1 hour
  });

  if (!response.ok) {
    throw new Error(`AniList API Error: ${response.status}`);
  }

  const json = await response.json();
  return json?.data?.Page?.media || [];
}
