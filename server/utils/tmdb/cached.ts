// In-memory caching of TMDB lookups. Limits: per server process, cleared on restart, not shared between
// instances. Failures are never cached. Provider availability changes, so it expires much sooner.
import { defineCachedFunction, useRuntimeConfig } from 'nitropack/runtime'
import { createTmdbClient } from './client.ts'
import { createTmdbService, type TmdbTarget } from './service.ts'

export const CACHE_SECONDS = {
  details: 60 * 60 * 24,
  credits: 60 * 60 * 24,
  videos: 60 * 60 * 12,
  providers: 60 * 60 * 3,
} as const

function service() {
  const config = useRuntimeConfig()
  return createTmdbService(createTmdbClient({ token: config.tmdbApiToken, baseUrl: config.tmdbApiBaseUrl }))
}

const base = (t: TmdbTarget) => `${t.mediaType}-${t.tmdbId}`

// swr is off so an expired entry is refetched rather than served stale.
export const getDetails = defineCachedFunction((t: TmdbTarget) => service().details(t), {
  name: 'tmdb-details',
  maxAge: CACHE_SECONDS.details,
  swr: false,
  // Details reflect the season, so it is part of the key.
  getKey: (t: TmdbTarget) => `${base(t)}-s${t.seasonNumber ?? 'none'}`,
})

export const getCredits = defineCachedFunction((t: TmdbTarget) => service().credits(t), {
  name: 'tmdb-credits',
  maxAge: CACHE_SECONDS.credits,
  swr: false,
  getKey: base,
})

export const getVideos = defineCachedFunction((t: TmdbTarget) => service().videos(t), {
  name: 'tmdb-videos',
  maxAge: CACHE_SECONDS.videos,
  swr: false,
  getKey: base,
})

export const getProviders = defineCachedFunction((t: TmdbTarget, region: string) => service().providers(t, region), {
  name: 'tmdb-providers',
  maxAge: CACHE_SECONDS.providers,
  swr: false,
  getKey: (t: TmdbTarget, region: string) => `${base(t)}-${region}`,
})
