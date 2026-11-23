// Collector registry: every player gets a code nobody else has, and a running number (the 42nd collector is #0042).
// The codes are printed on achievement cards, so two cards in the world never carry the same serial.
// Storage is any key-value store with these three calls (Nitro's useStorage fits); tests pass a Map.
export interface CollectorStore {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: unknown) => Promise<void>
}

export interface CollectorRecord {
  code: string
  number: number
  createdAt: string
}

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
export const CODE_PATTERN = /^[A-Z2-9]{5}$/

export function randomCode(random: (n: number) => number = (n) => Math.floor(Math.random() * n)): string {
  return Array.from({ length: 5 }, () => ALPHABET[random(ALPHABET.length)]).join('')
}

const COUNTER = '_counter'

/**
 * Returns the record for `wanted` if it is already registered, registers it if it is free (a code made on the
 * player's device before the registry existed), and otherwise issues a fresh code.
 */
export async function issueCollector(store: CollectorStore, wanted?: string, random?: (n: number) => number, now: () => Date = () => new Date()): Promise<CollectorRecord> {
  if (wanted && CODE_PATTERN.test(wanted)) {
    const existing = (await store.getItem(wanted)) as CollectorRecord | null
    if (existing) return existing
    return register(store, wanted, now)
  }
  for (let i = 0; i < 20; i++) {
    const code = randomCode(random)
    if (!(await store.getItem(code))) return register(store, code, now)
  }
  throw new Error('No free collector code found.')
}

async function register(store: CollectorStore, code: string, now: () => Date): Promise<CollectorRecord> {
  const number = (((await store.getItem(COUNTER)) as number | null) ?? 0) + 1
  await store.setItem(COUNTER, number)
  const record = { code, number, createdAt: now().toISOString() }
  await store.setItem(code, record)
  return record
}
