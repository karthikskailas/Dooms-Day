import { describe, expect, it } from 'vitest'
import { CODE_PATTERN, issueCollector, randomCode, type CollectorStore } from '../server/utils/collector.ts'

const fake = (): CollectorStore & { data: Map<string, unknown> } => {
  const data = new Map<string, unknown>()
  return { data, getItem: async (k) => data.get(k) ?? null, setItem: async (k, v) => void data.set(k, v) }
}

describe('collector registry', () => {
  it('makes five-character codes from the safe alphabet', () => {
    for (let i = 0; i < 50; i++) expect(randomCode()).toMatch(CODE_PATTERN)
  })

  it('numbers collectors in order', async () => {
    const s = fake()
    expect((await issueCollector(s)).number).toBe(1)
    expect((await issueCollector(s)).number).toBe(2)
  })

  it('never hands out a code twice', async () => {
    const s = fake()
    const first = await issueCollector(s, undefined, () => 0) // AAAAA
    const second = await issueCollector(s, undefined, (() => { let n = 0; return () => (n++ < 5 ? 0 : 1) })())
    expect(second.code).not.toBe(first.code)
  })

  it('keeps a code the browser already has, and registers it when it is free', async () => {
    const s = fake()
    const a = await issueCollector(s, 'K7M2Q')
    expect(a.code).toBe('K7M2Q')
    const again = await issueCollector(s, 'K7M2Q')
    expect(again.number).toBe(a.number)
  })

  it('ignores a malformed wanted code and issues a fresh one', async () => {
    const r = await issueCollector(fake(), 'not a code')
    expect(r.code).toMatch(CODE_PATTERN)
  })
})
