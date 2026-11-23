import { issueCollector, CODE_PATTERN } from '../utils/collector.ts'

// POST /api/collector  { code?: string } -> { code, number }
// Hands out a collector code that no other player has. A code a browser already holds is kept (registered if it was
// made before this existed, returned as is if known). Per-address limit: 20 new codes per hour, kept in memory.
const hits = new Map<string, { count: number; since: number }>()
const WINDOW = 60 * 60 * 1000
const LIMIT = 20

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.since > WINDOW) hits.set(ip, { count: 1, since: now })
  else if (++h.count > LIMIT) throw createError({ statusCode: 429, statusMessage: 'Too many requests. Try again later.' })

  const body = (await readBody<{ code?: unknown }>(event).catch(() => null)) ?? {}
  const wanted = typeof body.code === 'string' && CODE_PATTERN.test(body.code) ? body.code : undefined
  const record = await issueCollector(useStorage('collectors'), wanted)
  return { code: record.code, number: record.number }
})
