// Where a watch-provider row sends the user. TMDB supplies no deep links, only a region page, so known platforms get
// their own search or home page and everything else falls back to that region page (JustWatch via TMDB).
const q = encodeURIComponent

interface Rule {
  match: RegExp
  url: (title: string) => string
}

const RULES: readonly Rule[] = [
  { match: /youtube/i, url: (t) => `https://www.youtube.com/results?search_query=${q(t)}` },
  { match: /netflix/i, url: (t) => `https://www.netflix.com/search?q=${q(t)}` },
  { match: /amazon prime|prime video/i, url: (t) => `https://www.primevideo.com/search/?phrase=${q(t)}` },
  { match: /google play/i, url: (t) => `https://play.google.com/store/search?q=${q(t)}&c=movies` },
  { match: /apple tv/i, url: () => 'https://tv.apple.com/in' },
  { match: /hotstar|jio ?cinema|disney\+?/i, url: () => 'https://www.hotstar.com/in' },
  { match: /zee5/i, url: (t) => `https://www.zee5.com/search?q=${q(t)}` },
  { match: /sony ?liv/i, url: () => 'https://www.sonyliv.com' },
]

/** A link for a provider row, or null when nothing trustworthy is known. `fallback` is TMDB's region page. */
export function providerLink(name: string, searchText: string, fallback: string | null): string | null {
  const rule = RULES.find((r) => r.match.test(name))
  return rule ? rule.url(searchText) : fallback
}
