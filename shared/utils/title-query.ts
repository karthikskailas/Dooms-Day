/**
 * Derives a TMDB search query from an editorial display title, without changing the title.
 * "Daredevil - Season 2" searches for "Daredevil" and records season 2.
 */
export function parseTitleForSearch(title: string): { query: string; seasonNumber: number | null } {
  const season = /^(.*?)\s+-\s+Season\s+(\d+)$/i.exec(title)
  if (season) return { query: season[1]!.trim(), seasonNumber: Number(season[2]) }
  const limited = /^(.*?)\s+-\s+Limited Series$/i.exec(title)
  if (limited) return { query: limited[1]!.trim(), seasonNumber: null }
  return { query: title.trim(), seasonNumber: null }
}
