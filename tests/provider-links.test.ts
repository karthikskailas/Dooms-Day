import { describe, expect, it } from 'vitest'
import { providerLink } from '../app/utils/provider-links.ts'

const page = 'https://www.themoviedb.org/movie/1771/watch?locale=IN'

describe('providerLink', () => {
  it('searches the platform for the title when it supports it', () => {
    expect(providerLink('YouTube', 'X-Men 2000 movie', page)).toBe('https://www.youtube.com/results?search_query=X-Men%202000%20movie')
    expect(providerLink('Netflix', 'Thor', page)).toBe('https://www.netflix.com/search?q=Thor')
  })
  it('sends JioHotstar to Hotstar', () => {
    expect(providerLink('JioHotstar', 'x', page)).toBe('https://www.hotstar.com/in')
  })
  it('falls back to the region page, or null without one', () => {
    expect(providerLink('VI movies and tv', 'x', page)).toBe(page)
    expect(providerLink('VI movies and tv', 'x', null)).toBeNull()
  })
})
