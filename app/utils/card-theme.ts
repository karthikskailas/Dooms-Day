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
export function cardFilter(hue: number | null, priority: CardPriority, extra?: { hueShift: number; brightness: number }): string {
  const turn = (hue === null ? 0 : Math.round(hue - FRAME_HUE)) + (extra?.hueShift ?? 0)
  const bronze = priority === 'optional' ? ' sepia(0.5)' : ''
  return `hue-rotate(${turn}deg) saturate(${SATURATION[priority]}) brightness(${extra?.brightness ?? 1})${bronze}`
}

// ---------- Uniqueness: no two players get the same card ----------

/** Small deterministic hash (FNV-1a) of a string, as an unsigned 32-bit number. */
export function hashOf(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export interface CardVariation {
  /** Degrees added to the frame's hue turn. */
  hueShift: number
  /** Where the poster is framed in the window, 0-100 each. */
  focusX: number
  focusY: number
  /** Light level of the frame, so two cards of one title differ in brightness too. */
  brightness: number
}

/**
 * A look that belongs to one player's copy of one title: the same title earned by two people never matches, and the
 * same person's cards differ from each other. Seeded by the player's collector code and the title id.
 */
export function variationOf(collector: string, titleId: string): CardVariation {
  const h = hashOf(`${collector}:${titleId}`)
  const part = (shift: number, span: number) => ((h >>> shift) & 0xff) / 255 * span
  return {
    hueShift: Math.round(part(0, 50) - 25),
    focusX: Math.round(30 + part(8, 40)),
    focusY: Math.round(25 + part(16, 40)),
    brightness: Math.round((0.94 + part(24, 0.14)) * 100) / 100,
  }
}

const FIRST = ['Crimson', 'Silent', 'Iron', 'Golden', 'Midnight', 'Emerald', 'Solar', 'Frost', 'Shadow', 'Storm', 'Ember', 'Cobalt', 'Obsidian', 'Radiant', 'Phantom', 'Amber']
const SECOND = ['Sentinel', 'Falcon', 'Warden', 'Vanguard', 'Ranger', 'Oracle', 'Titan', 'Wraith', 'Herald', 'Striker', 'Guardian', 'Nomad', 'Valkyrie', 'Marshal', 'Seeker', 'Drifter']

/** A codename that belongs to one collector code, used until the player types their own name. */
export function codenameOf(collector: string): string {
  const h = hashOf(collector || 'x')
  return `${FIRST[h % FIRST.length]} ${SECOND[(h >>> 8) % SECOND.length]}`
}
