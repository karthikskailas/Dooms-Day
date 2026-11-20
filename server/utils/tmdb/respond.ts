import { getRouterParam, setResponseHeader, setResponseStatus, type H3Event } from 'h3'
import type { ApiErrorResponse, TitleResponse } from '../../../shared/types/tmdb.ts'
import { resolveTarget } from '../roadmap.ts'
import { ApiError } from './errors.ts'
import type { TmdbTarget } from './service.ts'

export const REGION = /^[A-Za-z]{2}$/

/**
 * Runs a title lookup and shapes the result. Success: { titleId, mediaType, data }.
 * Failure: { error: { code, message } } with a matching HTTP status. Unexpected errors are logged and hidden.
 */
export async function respondForTitle<T>(
  event: H3Event,
  cacheSeconds: number,
  run: (target: TmdbTarget) => Promise<T>,
): Promise<TitleResponse<T> | ApiErrorResponse> {
  const titleId = getRouterParam(event, 'titleId') ?? ''
  try {
    const target = resolveTarget(titleId)
    const data = await run(target)
    setResponseHeader(event, 'Cache-Control', `public, max-age=${cacheSeconds}`)
    return { titleId, mediaType: target.mediaType, data }
  } catch (err) {
    if (err instanceof ApiError) {
      setResponseStatus(event, err.statusCode)
      if (err.retryAfterSeconds !== null) setResponseHeader(event, 'Retry-After', err.retryAfterSeconds)
      return { error: { code: err.code, message: err.message } }
    }
    console.error(`[api/titles/${titleId}] unexpected error`, err)
    setResponseStatus(event, 500)
    return { error: { code: 'upstream_error', message: 'Unexpected server error.' } }
  }
}
