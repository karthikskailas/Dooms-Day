// Where things sit on the achievement card, in the 810 x 1080 space of the owner's design.
export const CARD_W = 810
export const CARD_H = 1080

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
  label: { x: 240, y: 820, w: 330, h: 64, size: 21.9 },
  foot: { x: 180, y: 905, w: 450, h: 70, size: 17.8 },
}

export const GOLD = '#c9a45a'
export const PALE = '#d8c7b0'
export const DIM = '#a27f3f'

export const titleSize = (title: string) => (title.length > 24 ? 17 : title.length > 16 ? 21 : 25)
export const pad = (n: number, w: number) => String(n).padStart(w, '0')
export const serialOf = (order: number, year: number) => `ACH-${pad(order, 3)}-${year}`
