import type { TitleCredits, TitleEpisodes, TitleMetadata, TitleProviders, TitleVideos } from '../../../shared/types/tmdb.ts'
import type { TmdbMediaType } from '../../../shared/types/tmdb-mapping.ts'
import type { TmdbClient } from './client.ts'
import {
  normalizeMovie,
  normalizeMovieCredits,
  normalizeProviders,
  normalizeSeasonEpisodes,
  normalizeTv,
  normalizeTvCredits,
  normalizeVideos,
} from './normalize.ts'
import {
  movieCreditsSchema,
  movieDetailsSchema,
  providersSchema,
  tvCreditsSchema,
  tvDetailsSchema,
  tvSeasonSchema,
  videosSchema,
} from './schemas.ts'

/** A verified TMDB identity for one project title. */
export interface TmdbTarget {
  mediaType: TmdbMediaType
  tmdbId: number
  /** The season a "Season N" project title represents. Metadata reflects it; credits, videos and providers are show-level. */
  seasonNumber: number | null
}

const LANGUAGE = 'en-US'

/** The four TMDB lookups the product needs, with no caching (see cached.ts). */
export function createTmdbService(client: TmdbClient) {
  return {
    async details(t: TmdbTarget): Promise<TitleMetadata> {
      if (t.mediaType === 'movie') {
        return normalizeMovie(await client.get(`/movie/${t.tmdbId}`, movieDetailsSchema, { language: LANGUAGE }))
      }
      return normalizeTv(await client.get(`/tv/${t.tmdbId}`, tvDetailsSchema, { language: LANGUAGE }), t.seasonNumber)
    },

    async credits(t: TmdbTarget): Promise<TitleCredits> {
      if (t.mediaType === 'movie') {
        return normalizeMovieCredits(await client.get(`/movie/${t.tmdbId}/credits`, movieCreditsSchema, { language: LANGUAGE }))
      }
      return normalizeTvCredits(await client.get(`/tv/${t.tmdbId}/aggregate_credits`, tvCreditsSchema, { language: LANGUAGE }))
    },

    async videos(t: TmdbTarget): Promise<TitleVideos> {
      return normalizeVideos(await client.get(`/${t.mediaType}/${t.tmdbId}/videos`, videosSchema, { language: LANGUAGE }))
    },

    /** Episodes of one season of a TV title. */
    async episodes(t: TmdbTarget, seasonNumber: number): Promise<TitleEpisodes> {
      return normalizeSeasonEpisodes(await client.get(`/tv/${t.tmdbId}/season/${seasonNumber}`, tvSeasonSchema, { language: LANGUAGE }))
    },

    async providers(t: TmdbTarget, region: string): Promise<TitleProviders> {
      return normalizeProviders(await client.get(`/${t.mediaType}/${t.tmdbId}/watch/providers`, providersSchema), region)
    },
  }
}
