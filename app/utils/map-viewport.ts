// Pan/zoom math for the map. A view maps map coordinates to screen: screen = map * k + (x, y).
import type { Rect } from './roadmap-map.ts'

export interface View {
  x: number
  y: number
  k: number
}

export const MIN_K = 0.2
export const MAX_K = 2

export const clampK = (k: number) => Math.min(MAX_K, Math.max(MIN_K, k))

/** Zooms to `k`, keeping the map point under screen position (px, py) fixed. */
export function zoomAt(v: View, px: number, py: number, k: number): View {
  const next = clampK(k)
  const ratio = next / v.k
  return { k: next, x: px - (px - v.x) * ratio, y: py - (py - v.y) * ratio }
}

/** The view that shows all of `bounds` inside a viewport of vw × vh with `pad` screen pixels around it. */
export function fitView(bounds: Rect, vw: number, vh: number, pad: number): View {
  const k = clampK(Math.min((vw - pad * 2) / bounds.w, (vh - pad * 2) / bounds.h))
  return {
    k,
    x: (vw - bounds.w * k) / 2 - bounds.x * k,
    y: (vh - bounds.h * k) / 2 - bounds.y * k,
  }
}

/** The view at scale `k` with map point (mx, my) at screen position (sx, sy). */
export function centerOn(mx: number, my: number, k: number, sx: number, sy: number): View {
  const kk = clampK(k)
  return { k: kk, x: sx - mx * kk, y: sy - my * kk }
}

/**
 * Pans minimally so `rect` (map coordinates) lies inside `free` (screen coordinates).
 * Returns the same view when it already does, so callers can skip a needless move.
 */
export function revealRect(v: View, rect: Rect, free: Rect): View {
  const left = rect.x * v.k + v.x
  const top = rect.y * v.k + v.y
  const right = left + rect.w * v.k
  const bottom = top + rect.h * v.k
  let dx = 0
  let dy = 0
  if (left < free.x) dx = free.x - left
  else if (right > free.x + free.w) dx = free.x + free.w - right
  if (top < free.y) dy = free.y - top
  else if (bottom > free.y + free.h) dy = free.y + free.h - bottom
  return dx === 0 && dy === 0 ? v : { ...v, x: v.x + dx, y: v.y + dy }
}
