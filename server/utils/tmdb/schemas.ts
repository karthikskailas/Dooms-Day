// Raw TMDB response shapes, limited to the fields we use. Unknown fields are ignored; absent ones are tolerated.
import { z } from 'zod'

const str = z.string().nullish()
const num = z.number().nullish()

export const searchResultsSchema = z.object({
  results: z.array(
    z.object({
      id: z.number(),
      title: str,
      name: str,
      original_title: str,
      original_name: str,
      release_date: str,
      first_air_date: str,
      popularity: num,
    }),
  ),
})

const genres = z.array(z.object({ id: z.number(), name: z.string() })).nullish()

export const movieDetailsSchema = z.object({
  id: z.number(),
  title: str,
  original_title: str,
  tagline: str,
  overview: str,
  release_date: str,
  runtime: num,
  genres,
  poster_path: str,
  backdrop_path: str,
  status: str,
})

export const tvDetailsSchema = z.object({
  id: z.number(),
  name: str,
  original_name: str,
  tagline: str,
  overview: str,
  first_air_date: str,
  last_air_date: str,
  number_of_seasons: num,
  number_of_episodes: num,
  episode_run_time: z.array(z.number()).nullish(),
  genres,
  poster_path: str,
  backdrop_path: str,
  status: str,
  seasons: z
    .array(
      z.object({
        season_number: z.number(),
        name: str,
        overview: str,
        air_date: str,
        episode_count: num,
        poster_path: str,
      }),
    )
    .nullish(),
})

export const movieCreditsSchema = z.object({
  cast: z
    .array(z.object({ id: z.number(), name: z.string(), character: str, profile_path: str, order: num }))
    .nullish(),
  crew: z
    .array(z.object({ id: z.number(), name: z.string(), job: str, department: str, profile_path: str }))
    .nullish(),
})

// TV credits use aggregate_credits: roles and jobs are per person across all seasons.
export const tvCreditsSchema = z.object({
  cast: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        roles: z.array(z.object({ character: str })).nullish(),
        profile_path: str,
        order: num,
      }),
    )
    .nullish(),
  crew: z
    .array(
      z.object({
        id: z.number(),
        name: z.string(),
        jobs: z.array(z.object({ job: str })).nullish(),
        department: str,
        profile_path: str,
      }),
    )
    .nullish(),
})

export const videosSchema = z.object({
  results: z.array(
    z.object({
      key: z.string(),
      name: str,
      site: str,
      type: str,
      official: z.boolean().nullish(),
      published_at: str,
    }),
  ),
})

const offers = z
  .array(z.object({ provider_id: z.number(), provider_name: z.string(), logo_path: str, display_priority: num }))
  .nullish()

export const providersSchema = z.object({
  results: z.record(
    z.string(),
    z.object({ link: str, flatrate: offers, free: offers, ads: offers, rent: offers, buy: offers }),
  ),
})

export type SearchResults = z.infer<typeof searchResultsSchema>
export type RawMovieDetails = z.infer<typeof movieDetailsSchema>
export type RawTvDetails = z.infer<typeof tvDetailsSchema>
export type RawMovieCredits = z.infer<typeof movieCreditsSchema>
export type RawTvCredits = z.infer<typeof tvCreditsSchema>
export type RawVideos = z.infer<typeof videosSchema>
export type RawProviders = z.infer<typeof providersSchema>
