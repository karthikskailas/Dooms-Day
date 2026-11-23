// Draws an achievement card to a PNG. It mirrors AchievementCard.vue layer by layer on a canvas, using the same
// positions (card-layout.ts) and filter (card-theme.ts), so the saved image matches what is on screen.
// Limit: ctx.filter is not supported by every Safari version; there the frame keeps its original colours.
import { cardFilter, type CardPriority } from './card-theme.ts'
import { CARD, CARD_H, CARD_W, DIM, GOLD, PALE, pad, serialOf, titleSize } from './card-layout.ts'

/** URLs of the four card layers, imported where the bundler can resolve them. */
export interface CardLayers {
  frame: string
  bg: string
  ring: string
  knight: string
}

export interface CardExport {
  title: string
  order: number
  year: number
  type: string
  priority: CardPriority
  featuring: string[]
  player: string
  date: string
  art: string | null
  hue: number | null
}

const SCALE = 1080 / CARD_W // 1080 x 1440 output
const PRIORITY = { essential: 'Essential', recommended: 'Recommended', optional: 'Optional' } as const

function load(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const k = Math.max(w / img.width, h / img.height)
  const dw = img.width * k
  const dh = img.height * k
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
}

export async function renderCard(c: CardExport, layers: CardLayers): Promise<Blob> {
  await Promise.all([document.fonts.load('600 40px "Barlow Condensed"'), document.fonts.load('700 40px "Barlow Condensed"')])
  const [frame, bg, ring, knight, art] = await Promise.all([
    load(layers.frame),
    load(layers.bg),
    load(layers.ring),
    load(layers.knight),
    c.art ? load(c.art, true).catch(() => null) : Promise.resolve(null),
  ])

  const canvas = document.createElement('canvas')
  canvas.width = Math.round(CARD_W * SCALE)
  canvas.height = Math.round(CARD_H * SCALE)
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)
  const finish = cardFilter(c.hue, c.priority)

  ctx.save()
  ctx.filter = finish
  ctx.drawImage(bg, 0, 0, CARD_W, CARD_H)

  const w = CARD.window
  ctx.save()
  ctx.beginPath()
  ctx.rect(w.x, w.y, w.w, w.h)
  ctx.clip()
  ctx.drawImage(knight, 0, 0, CARD_W, CARD_H)
  if (art) {
    ctx.filter = `${finish} saturate(0.85) contrast(1.05) sepia(0.25)`
    cover(ctx, art, w.x, w.y, w.w, w.h)
    ctx.filter = finish
  }
  const shade = ctx.createLinearGradient(0, w.y + w.h, 0, w.y)
  shade.addColorStop(0, 'rgba(11,14,12,0.8)')
  shade.addColorStop(0.5, 'rgba(11,14,12,0)')
  shade.addColorStop(1, 'rgba(11,14,12,0.3)')
  ctx.fillStyle = shade
  ctx.fillRect(w.x, w.y, w.w, w.h)
  ctx.restore()

  ctx.globalAlpha = 0.7
  ctx.globalCompositeOperation = 'screen'
  ctx.drawImage(ring, 0, 0, CARD_W, CARD_H)
  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  ctx.drawImage(frame, 0, 0, CARD_W, CARD_H)
  ctx.restore()

  // Text
  const text = (s: string, x: number, y: number, size: number, color: string, weight: number, spacing: number, rotate = 0, maxW?: number) => {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate((rotate * Math.PI) / 180)
    ctx.font = `${weight} ${size}px "Barlow Condensed", sans-serif`
    ctx.letterSpacing = `${size * spacing}px`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(s.toUpperCase(), 0, 0, maxW)
    ctx.restore()
  }
  text('Road to Doomsday', CARD_W / 2, CARD.header.y + CARD.header.size * 0.7, CARD.header.size, GOLD, 600, 0.18)
  text(c.title, CARD.titleSide.cx, CARD.titleSide.cy, titleSize(c.title), GOLD, 600, 0.14, -90, CARD.titleSide.w)
  text(serialOf(c.order, c.year), CARD.serialSide.cx, CARD.serialSide.cy, CARD.serialSide.size, GOLD, 600, 0.14, 90, CARD.serialSide.w)
  ctx.save()
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  text(pad(c.order, 2), CARD.step.cx, CARD.step.cy, CARD.step.size, PALE, 700, 0)
  ctx.restore()
  const nd = CARD.nameDate
  text(c.player, nd.x + nd.w / 4, nd.y + nd.h / 2, nd.size, PALE, 600, 0.12, 0, nd.w / 2 - 40)
  text(c.date, nd.x + (nd.w * 3) / 4, nd.y + nd.h / 2, nd.size, PALE, 600, 0.12, 0, nd.w / 2 - 40)
  text(PRIORITY[c.priority], CARD.label.x + CARD.label.w / 2, CARD.label.y + CARD.label.h / 2, CARD.label.size, GOLD, 600, 0.2)
  const f = CARD.foot
  text(c.featuring.slice(0, 3).join(' · '), f.x + f.w / 2, f.y + f.h * 0.34, f.size, GOLD, 600, 0.16, 0, f.w)
  text(`${c.type} · ${c.year}`, f.x + f.w / 2, f.y + f.h * 0.68, f.size, DIM, 600, 0.16, 0, f.w)

  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png')
    } catch (e) {
      reject(e as Error)
    }
  })
}

export const fileNameFor = (order: number, title: string) =>
  `road-to-doomsday-${pad(order, 2)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`
