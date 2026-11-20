export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/'

export type TmdbImageSize = 'w92' | 'w185' | 'w342' | 'w500' | 'w780' | 'w1280' | 'original'

// TMDB image paths look like "/abc123.jpg". Anything else is treated as untrusted and dropped.
const SAFE_PATH = /^\/[A-Za-z0-9._-]+\.(?:jpg|jpeg|png|svg)$/i

/** Builds an image URL from a TMDB image path, or null when there is no usable path. */
export function tmdbImageUrl(path: string | null | undefined, size: TmdbImageSize): string | null {
  if (!path || !SAFE_PATH.test(path)) return null
  return `${TMDB_IMAGE_BASE_URL}${size}${path}`
}
