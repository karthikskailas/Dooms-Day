// POST /api/feedback  { message, page?, contact? } -> { ok: true }
// Stores a mistake report or suggestion in the same KV store as the collector codes, under the key prefix `feedback:`.
// Read them in the Cloudflare dashboard: Workers & Pages > KV > the COLLECTORS namespace, filter by prefix `feedback:`.
// Per-address limit: 5 per hour, kept in memory (resets on restart, not shared between instances).
const hits = new Map<string, { count: number; since: number }>()
const WINDOW = 60 * 60 * 1000
const LIMIT = 5

const clip = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '')

export default defineEventHandler(async (event) => {
  const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.since > WINDOW) hits.set(ip, { count: 1, since: now })
  else if (++h.count > LIMIT) throw createError({ statusCode: 429, statusMessage: 'Too many reports. Try again later.' })

  const body = (await readBody<Record<string, unknown>>(event).catch(() => null)) ?? {}
  const message = clip(body.message, 1000)
  if (message.length < 5) throw createError({ statusCode: 400, statusMessage: 'Write a few words about what is wrong.' })

  const createdAt = new Date(now).toISOString()
  const key = `feedback:${createdAt}-${Math.random().toString(36).slice(2, 7)}`
  await useStorage('collectors').setItem(key, {
    message,
    page: clip(body.page, 200),
    contact: clip(body.contact, 100),
    createdAt,
  })
  return { ok: true }
})
