// Per-title look for an achievement card: the frame's colours turn toward the title's own artwork.
// The base frame is gold (about 42 degrees); the filter rotates that toward the poster's dominant hue.
export type CardPriority = 'essential' | 'recommended' | 'optional'

const FRAME_HUE = 42

/** Dominant hue (0-360) of an image, weighted by colour strength; null when it is nearly grey. */
export function dominantHue(img: CanvasImageSource & { width?: number; height?: number }): number | null {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 48
  const g = c.getContext('2d', { willReadFrequently: true })
  if (!g) return null
  g.drawImage(img, 0, 0, 32, 48)
  const { data } = g.getImageData(0, 0, 32, 48)
  let x = 0
  let y = 0
  let strength = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]! / 255
    const gr = data[i + 1]! / 255
    const b = data[i + 2]! / 255
    const max = Math.max(r, gr, b)
    const min = Math.min(r, gr, b)
    const s = max === 0 ? 0 : (max - min) / max
    const w = s * s * max
    if (w < 0.02) continue
    const d = max - min
    const h = d === 0 ? 0 : max === r ? ((gr - b) / d) % 6 : max === gr ? (b - r) / d + 2 : (r - gr) / d + 4
    const a = (h * 60 * Math.PI) / 180
    x += Math.cos(a) * w
    y += Math.sin(a) * w
    strength += w
  }
  if (strength < 3) return null
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

const SATURATION: Record<CardPriority, number> = { essential: 1.15, recommended: 0.7, optional: 0.45 }

/** CSS and canvas filter for the frame layers. `hue` null keeps the original gold and green. */
export function cardFilter(hue: number | null, priority: CardPriority): string {
  const turn = hue === null ? 0 : Math.round(hue - FRAME_HUE)
  const bronze = priority === 'optional' ? ' sepia(0.5)' : ''
  return `hue-rotate(${turn}deg) saturate(${SATURATION[priority]})${bronze}`
}
