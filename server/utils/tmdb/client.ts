import type { z } from 'zod'
import { ApiError } from './errors.ts'

// api.tmdb.org serves the same API as api.themoviedb.org. It is the default because api.themoviedb.org reset
// 8 of 10 new connections from the development network (api.tmdb.org: 0 of 10), and the target audience is in
// India where that kind of blocking is common. Override with NUXT_TMDB_API_BASE_URL.
export const DEFAULT_TMDB_BASE_URL = 'https://api.tmdb.org/3'

// The bearer token is sent to this host, so the base URL is restricted to TMDB's own API hostnames.
const ALLOWED_HOSTS = new Set(['api.themoviedb.org', 'api.tmdb.org'])

export interface TmdbClientOptions {
  /** TMDB v4 "API Read Access Token". Empty or missing makes every call fail with credentials_missing. */
  token: string | undefined
  baseUrl?: string
  fetchImpl?: typeof fetch
  timeoutMs?: number
  /** Pause before the single retry of a failed connection. */
  retryDelayMs?: number
}

export type TmdbQuery = Record<string, string | number | boolean | undefined>

export interface TmdbClient {
  get: <T>(path: string, schema: z.ZodType<T>, query?: TmdbQuery) => Promise<T>
}

function parseRetryAfter(header: string | null): number | null {
  if (!header) return null
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return Math.ceil(seconds)
  const date = Date.parse(header)
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - Date.now()) / 1000))
}

export function createTmdbClient(options: TmdbClientOptions): TmdbClient {
  const { token, fetchImpl = fetch, timeoutMs = 8000, retryDelayMs = 250 } = options
  const baseUrl = (options.baseUrl || DEFAULT_TMDB_BASE_URL).replace(/\/+$/, '')

  return {
    async get(path, schema, query = {}) {
      if (!token) {
        throw new ApiError('credentials_missing', 'TMDB credentials are not configured on the server.', 503)
      }
      let url: URL
      try {
        url = new URL(`${baseUrl}${path}`)
      } catch {
        throw new ApiError('upstream_error', 'TMDB base URL is invalid.', 503)
      }
      if (url.protocol !== 'https:' || !ALLOWED_HOSTS.has(url.hostname)) {
        throw new ApiError('upstream_error', 'TMDB base URL must be https on a TMDB API host.', 503)
      }
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) url.searchParams.set(key, String(value))
      }

      const request = () =>
        fetchImpl(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        })
      const isTimeout = (err: unknown) => err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')

      let res: Response
      try {
        try {
          res = await request()
        } catch (err) {
          if (isTimeout(err)) throw err
          // A reset connection is often transient; retry once, never on a timeout.
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs))
          res = await request()
        }
      } catch (err) {
        const timedOut = isTimeout(err)
        throw new ApiError('network_error', timedOut ? 'TMDB did not respond in time.' : 'Could not reach TMDB.', timedOut ? 504 : 502)
      }

      if (res.status === 401) throw new ApiError('credentials_invalid', 'TMDB rejected the configured credentials.', 503)
      if (res.status === 404) throw new ApiError('tmdb_not_found', 'TMDB has no record for this title.', 404)
      if (res.status === 429) {
        throw new ApiError('rate_limited', 'TMDB rate limit reached. Try again shortly.', 429, parseRetryAfter(res.headers.get('retry-after')))
      }
      if (!res.ok) throw new ApiError('upstream_error', `TMDB responded with status ${res.status}.`, 502)

      let body: unknown
      try {
        body = await res.json()
      } catch {
        throw new ApiError('malformed_response', 'TMDB returned a response that is not valid JSON.', 502)
      }
      const parsed = schema.safeParse(body)
      if (!parsed.success) {
        throw new ApiError('malformed_response', 'TMDB returned an unexpected response shape.', 502)
      }
      return parsed.data
    },
  }
}
