import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import type { ApiError } from '../server/utils/tmdb/errors.ts'
import { createTmdbClient } from '../server/utils/tmdb/client.ts'

const schema = z.object({ id: z.number() })
const json = (body: unknown, init?: ResponseInit) => new Response(JSON.stringify(body), { status: 200, ...init })
const clientWith = (impl: (url: URL, init?: RequestInit) => Promise<Response>, over = {}) =>
  createTmdbClient({ token: 'secret-token', fetchImpl: impl as typeof fetch, retryDelayMs: 0, ...over })
const failure = async (p: Promise<unknown>) => {
  try {
    await p
  } catch (e) {
    return e as ApiError
  }
  throw new Error('expected a failure')
}

describe('tmdb client', () => {
  it('sends the bearer token and query, skipping undefined values', async () => {
    const fetchImpl = vi.fn(async () => json({ id: 1 }))
    const out = await clientWith(fetchImpl as never).get('/movie/1', schema, { language: 'en-US', page: undefined })
    expect(out).toEqual({ id: 1 })
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [URL, RequestInit]
    expect(url.toString()).toBe('https://api.tmdb.org/3/movie/1?language=en-US')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret-token')
  })

  it('fails with credentials_missing, without any request, when there is no token', async () => {
    const fetchImpl = vi.fn()
    const e = await failure(createTmdbClient({ token: '', fetchImpl: fetchImpl as never }).get('/x', schema))
    expect(e).toMatchObject({ code: 'credentials_missing', statusCode: 503 })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it.each([
    [401, 'credentials_invalid', 503],
    [404, 'tmdb_not_found', 404],
    [500, 'upstream_error', 502],
    [503, 'upstream_error', 502],
    [422, 'upstream_error', 502],
  ])('maps HTTP %i to %s', async (status, code, statusCode) => {
    const e = await failure(clientWith(async () => new Response('{}', { status })).get('/x', schema))
    expect(e).toMatchObject({ code, statusCode })
  })

  it('maps 429 to rate_limited with Retry-After seconds', async () => {
    const e = await failure(clientWith(async () => new Response('{}', { status: 429, headers: { 'retry-after': '7' } })).get('/x', schema))
    expect(e).toMatchObject({ code: 'rate_limited', statusCode: 429, retryAfterSeconds: 7 })
  })

  it('maps 429 without a usable Retry-After to null', async () => {
    const e = await failure(clientWith(async () => new Response('{}', { status: 429 })).get('/x', schema))
    expect(e.retryAfterSeconds).toBeNull()
  })

  it('maps timeouts and network failures', async () => {
    const timeout = Object.assign(new Error('t'), { name: 'TimeoutError' })
    expect(await failure(clientWith(async () => Promise.reject(timeout)).get('/x', schema))).toMatchObject({ code: 'network_error', statusCode: 504 })
    expect(await failure(clientWith(async () => Promise.reject(new TypeError('fetch failed'))).get('/x', schema))).toMatchObject({ code: 'network_error', statusCode: 502 })
  })

  it('retries a reset connection once, and succeeds if the retry does', async () => {
    let calls = 0
    const impl = vi.fn(async () => (++calls === 1 ? Promise.reject(new TypeError('fetch failed')) : json({ id: 1 })))
    expect(await clientWith(impl as never).get('/x', schema)).toEqual({ id: 1 })
    expect(impl).toHaveBeenCalledTimes(2)
  })

  it('gives up after one retry, and never retries a timeout', async () => {
    const reset = vi.fn(async () => Promise.reject(new TypeError('fetch failed')))
    await failure(clientWith(reset as never).get('/x', schema))
    expect(reset).toHaveBeenCalledTimes(2)
    const timeout = vi.fn(async () => Promise.reject(Object.assign(new Error('t'), { name: 'TimeoutError' })))
    await failure(clientWith(timeout as never).get('/x', schema))
    expect(timeout).toHaveBeenCalledTimes(1)
  })

  it('defaults to the more reliable TMDB hostname', async () => {
    const impl = vi.fn(async () => json({ id: 1 }))
    await clientWith(impl as never).get('/movie/1', schema)
    expect((impl.mock.calls[0] as unknown as [URL])[0].toString()).toBe('https://api.tmdb.org/3/movie/1')
  })

  it('reports non-JSON and wrongly shaped responses as malformed', async () => {
    expect(await failure(clientWith(async () => new Response('<html>', { status: 200 })).get('/x', schema))).toMatchObject({ code: 'malformed_response' })
    expect(await failure(clientWith(async () => json({ id: 'not a number' })).get('/x', schema))).toMatchObject({ code: 'malformed_response' })
  })

  it('never puts the token in an error message', async () => {
    const e = await failure(clientWith(async () => new Response('{}', { status: 401 })).get('/x', schema))
    expect(e.message).not.toContain('secret-token')
  })

  it('refuses to send the token to a non-TMDB or non-https base URL', async () => {
    const fetchImpl = vi.fn(async () => json({ id: 1 }))
    for (const baseUrl of ['https://evil.example/3', 'http://api.themoviedb.org/3', 'not a url']) {
      const e = await failure(clientWith(fetchImpl as never, { baseUrl }).get('/x', schema))
      expect(e.code).toBe('upstream_error')
    }
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('accepts the other TMDB API host', async () => {
    const fetchImpl = vi.fn(async () => json({ id: 1 }))
    await clientWith(fetchImpl as never, { baseUrl: 'https://api.themoviedb.org/3/' }).get('/movie/1', schema)
    expect((fetchImpl.mock.calls[0] as unknown as [URL])[0].toString()).toBe('https://api.themoviedb.org/3/movie/1')
  })
})
