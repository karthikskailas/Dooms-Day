// Where things sit on the achievement card, in the 810 x 1080 space of the owner's design.
export const CARD_W = 810
export const CARD_H = 1080

/** The card's own outline inside the 810 x 1080 design space; everything outside it is empty. */
export const VIEW = { x: 90, y: 46, w: 627, h: 1005 }

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export const CARD = {
  window: { x: 212, y: 151, w: 385, h: 524 } as Box,
  header: { y: 103, size: 24.3 },
  /** Vertical title (left, reads upward) and serial (right, reads downward): centre x, centre y, text width. */
  titleSide: { cx: 165, cy: 405, w: 420 },
  serialSide: { cx: 645, cy: 405, w: 420, size: 22.7 },
  step: { cx: 405, cy: 667, size: 72.9 },
  nameDate: { x: 120, y: 752, w: 570, h: 56, size: 25.1 },
  label: { x: 240, y: 820, w: 330, h: 64, size: 20 },
  foot: { x: 180, y: 905, w: 450, h: 70, size: 17.8 },
}

export const GOLD = '#c9a45a'
export const PALE = '#d8c7b0'
export const DIM = '#a27f3f'

export const titleSize = (title: string) => (title.length > 24 ? 17 : title.length > 16 ? 21 : 25)
export const pad = (n: number, w: number) => String(n).padStart(w, '0')
/** Serial printed on a card. The collector code makes it unique to whoever earned it. */
export const serialOf = (order: number, collector: string) => `ACH-${pad(order, 3)}-${collector || 'XXXXX'}`

/**
 * Fits the tagline into the plate: one line at full size, then a smaller one line, then two lines. Character width is
 * estimated (condensed caps plus letter spacing), erring wide so text never reaches the plate's ornaments.
 */
export function taglineFit(text: string): { size: number; lines: string[] } {
  const max = CARD.label.w - 90
  const wide = (s: string, size: number) => s.length * size * 0.7
  for (let size = CARD.label.size; size >= 14; size--) if (wide(text, size) <= max) return { size, lines: [text] }
  const words = text.split(' ')
  let best = { size: 14, lines: [text] }
  let gap = Infinity
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(' ')
    const b = words.slice(i).join(' ')
    const d = Math.abs(a.length - b.length)
    if (d < gap) {
      gap = d
      best = { size: 14, lines: [a, b] }
    }
  }
  for (let size = 17; size >= 12; size--) if (best.lines.every((l) => wide(l, size) <= max)) return { size, lines: best.lines }
  return { size: 12, lines: best.lines }
}
