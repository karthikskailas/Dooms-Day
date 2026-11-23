// Draws an achievement card to a PNG. It mirrors AchievementCard.vue layer by layer on a canvas, using the same
// positions (card-layout.ts) and filter (card-theme.ts), so the saved image matches what is on screen.
// Limit: ctx.filter is not supported by every Safari version; there the frame keeps its original colours.
import { collectionMeta } from './collection.ts'
import { SITE_HOST } from './site.ts'
import { cardFilter, dominantHue, variationOf, type CardPriority } from './card-theme.ts'
import { CARD, CARD_H, CARD_W, DIM, GOLD, PALE, VIEW, pad, serialOf, taglineFit, titleSize } from './card-layout.ts'

/** URLs of the four card layers, imported where the bundler can resolve them. */
export interface CardLayers {
  frame: string
  bg: string
  ring: string
  knight: string
}

export interface CardExport {
  titleId: string
  title: string
  order: number
  year: number
  collector: string
  type: string
  priority: CardPriority
  tagline: string
  featuring: string[]
  player: string
  date: string
  art: string | null
  hue: number | null
}

const SCALE = 1080 / CARD_W // 1080 x 1440 output

function load(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    if (cors) img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Could not load ${src}`))
    img.src = src
  })
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, fx = 0.5, fy = 0.5) {
  const k = Math.max(w / img.width, h / img.height)
  const dw = img.width * k
  const dh = img.height * k
  ctx.drawImage(img, x + (w - dw) * fx, y + (h - dh) * fy, dw, dh)
}

/** The lines under a shared image: what it counts down to, the date, and where to go. */
function footerLines() {
  const day = new Date(`${collectionMeta.target_release_date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  return [`COUNTDOWN TO ${collectionMeta.target_title.toUpperCase()}`, `${day.toUpperCase()}  ·  COLLECT THEM ALL`, `GO TO ${SITE_HOST.toUpperCase()}`]
}

export type CardFormat = 'card' | 'story'

async function drawCard(c: CardExport, layers: CardLayers): Promise<{ canvas: HTMLCanvasElement; art: HTMLImageElement | null; bg: HTMLImageElement }> {
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
  const v = variationOf(c.collector, c.titleId)
  const finish = cardFilter(c.hue, c.priority, v)

  ctx.save()
  ctx.filter = finish
  const w = CARD.window
  ctx.save()
  ctx.beginPath()
  ctx.rect(w.x, w.y, w.w, w.h)
  ctx.clip()
  ctx.drawImage(knight, 0, 0, CARD_W, CARD_H)
  if (art) {
    ctx.filter = `${finish} saturate(0.85) contrast(1.05) sepia(0.25)`
    cover(ctx, art, w.x, w.y, w.w, w.h, v.focusX / 100, v.focusY / 100)
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
  text(serialOf(c.order, c.collector), CARD.serialSide.cx, CARD.serialSide.cy, CARD.serialSide.size, GOLD, 600, 0.14, 90, CARD.serialSide.w)
  ctx.save()
  ctx.shadowColor = '#000'
  ctx.shadowBlur = 6
  ctx.shadowOffsetY = 2
  text(pad(c.order, 2), CARD.step.cx, CARD.step.cy, CARD.step.size, PALE, 700, 0)
  ctx.restore()
  const nd = CARD.nameDate
  text(c.player, nd.x + nd.w / 4, nd.y + nd.h / 2, nd.size, PALE, 600, 0.12, 0, nd.w / 2 - 40)
  text(c.date, nd.x + (nd.w * 3) / 4, nd.y + nd.h / 2, nd.size, PALE, 600, 0.12, 0, nd.w / 2 - 40)
  // The tagline shrinks, then wraps to two lines, so it never reaches the plate's ornaments.
  const fit = taglineFit(c.tagline)
  const lh = fit.size * 1.2
  fit.lines.forEach((l, i, all) => text(l, CARD.label.x + CARD.label.w / 2, CARD.label.y + CARD.label.h / 2 + (i - (all.length - 1) / 2) * lh, fit.size, GOLD, 600, 0.16))
  const f = CARD.foot
  text(c.featuring.slice(0, 3).join(' · '), f.x + f.w / 2, f.y + f.h * 0.34, f.size, GOLD, 600, 0.16, 0, f.w)
  text(`${c.type} · ${c.year}`, f.x + f.w / 2, f.y + f.h * 0.68, f.size, DIM, 600, 0.16, 0, f.w)

  // Crop to the card's own outline; the rest of the canvas is empty.
  const out = document.createElement('canvas')
  out.width = Math.round(VIEW.w * SCALE)
  out.height = Math.round(VIEW.h * SCALE)
  out.getContext('2d')!.drawImage(canvas, VIEW.x * SCALE, VIEW.y * SCALE, VIEW.w * SCALE, VIEW.h * SCALE, 0, 0, out.width, out.height)
  return { canvas: out, art, bg }
}

const toBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    try {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not create the image.'))), 'image/png')
    } catch (e) {
      reject(e as Error)
    }
  })

// Story: 1080 x 1920. Instagram covers roughly the top 250 px and bottom 340 px with its own controls, so the card
// sits between them. The backdrop is the title's poster, blurred and dimmed (the card's scene without a poster).
const STORY_W = 1080
const STORY_H = 1920
const STORY_CARD_W = 820

export async function renderCard(c: CardExport, layers: CardLayers, format: CardFormat = 'card'): Promise<Blob> {
  const { canvas, art, bg } = await drawCard(c, layers)
  if (format === 'card') return toBlob(canvas)

  const story = document.createElement('canvas')
  story.width = STORY_W
  story.height = STORY_H
  const ctx = story.getContext('2d')!
  ctx.fillStyle = '#0b0e0c'
  ctx.fillRect(0, 0, STORY_W, STORY_H)
  ctx.save()
  ctx.filter = `${cardFilter(c.hue, c.priority)} blur(28px) brightness(0.55)`
  cover(ctx, art ?? bg, -60, -60, STORY_W + 120, STORY_H + 120)
  ctx.restore()
  const vignette = ctx.createLinearGradient(0, 0, 0, STORY_H)
  vignette.addColorStop(0, 'rgba(11,14,12,0.7)')
  vignette.addColorStop(0.5, 'rgba(11,14,12,0.1)')
  vignette.addColorStop(1, 'rgba(11,14,12,0.8)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  const h = (STORY_CARD_W * VIEW.h) / VIEW.w
  const x = (STORY_W - STORY_CARD_W) / 2
  const y = 270
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 60
  ctx.shadowOffsetY = 24
  ctx.drawImage(canvas, x, y, STORY_CARD_W, h)
  ctx.restore()

  ctx.font = '600 34px "Barlow Condensed", sans-serif'
  ctx.letterSpacing = '8px'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = GOLD
  ctx.fillText(footerLines()[0]!, STORY_W / 2, y + h + 70)
  ctx.font = '600 26px "Barlow Condensed", sans-serif'
  ctx.fillStyle = DIM
  ctx.fillText(footerLines()[1]!, STORY_W / 2, y + h + 112)
  ctx.font = '700 30px "Barlow Condensed", sans-serif'
  ctx.fillStyle = PALE
  ctx.fillText(footerLines()[2]!, STORY_W / 2, y + h + 168)
  return toBlob(story)
}

export const fileNameFor = (order: number, title: string, format: CardFormat = 'card') =>
  `road-to-doomsday-${format}-${pad(order, 2)}-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}.png`

export interface GalleryHead {
  player: string
  collector: string
  /** Running collector number from the server, when known. */
  number: number | null
  count: number
  total: number
}

async function hueOf(url: string | null): Promise<number | null> {
  if (!url) return null
  try {
    return dominantHue(await load(url, true))
  } catch {
    return null
  }
}

// Collection image: up to nine cards on one 1080 x 1920 story, newest first, with the player's name and collector code.
export async function renderGallery(cards: CardExport[], head: GalleryHead, layers: CardLayers): Promise<Blob> {
  const shown = cards.slice(0, 9)
  const drawn = await Promise.all(shown.map(async (c) => drawCard({ ...c, hue: c.hue ?? (await hueOf(c.art)) }, layers)))

  const canvas = document.createElement('canvas')
  canvas.width = STORY_W
  canvas.height = STORY_H
  const ctx = canvas.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, STORY_H)
  g.addColorStop(0, '#16201a')
  g.addColorStop(0.5, '#0b0e0c')
  g.addColorStop(1, '#131916')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, STORY_W, STORY_H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = GOLD
  ctx.font = '700 64px "Barlow Condensed", sans-serif'
  ctx.letterSpacing = '8px'
  // The group (title, cards, footer) is centred between Instagram's top and bottom controls.
  const rows = Math.max(1, Math.ceil(drawn.length / 3))
  const cw = rows === 1 ? 300 : 250
  const ch = (cw * VIEW.h) / VIEW.w
  const gap = 24
  const blockH = rows * ch + (rows - 1) * gap
  const y0 = 330 + (1250 - blockH) / 2 + 60
  ctx.fillText(`${head.player}'s collection`.toUpperCase(), STORY_W / 2, y0 - 120, STORY_W - 120)
  ctx.fillStyle = PALE
  ctx.font = '600 34px "Barlow Condensed", sans-serif'
  ctx.letterSpacing = '6px'
  ctx.fillText(`${head.count} OF ${head.total} UNLOCKED  ·  COLLECTOR ${head.number === null ? '' : `#${String(head.number).padStart(4, '0')} · `}${head.collector}`, STORY_W / 2, y0 - 58)

  drawn.forEach((d, i) => {
    const inRow = Math.min(3, drawn.length - Math.floor(i / 3) * 3)
    const rowX0 = (STORY_W - (inRow * cw + (inRow - 1) * gap)) / 2
    const x = rowX0 + (i % 3) * (cw + gap)
    const y = y0 + Math.floor(i / 3) * (ch + gap)
    ctx.drawImage(d.canvas, x, y, cw, ch)
  })

  ctx.fillStyle = GOLD
  ctx.font = '600 34px "Barlow Condensed", sans-serif'
  ctx.letterSpacing = '8px'
  ctx.fillText(footerLines()[0]!, STORY_W / 2, y0 + blockH + 64)
  ctx.fillStyle = DIM
  ctx.font = '600 26px "Barlow Condensed", sans-serif'
  ctx.fillText(footerLines()[1]!, STORY_W / 2, y0 + blockH + 104)
  ctx.font = '700 30px "Barlow Condensed", sans-serif'
  ctx.fillStyle = PALE
  ctx.fillText(footerLines()[2]!, STORY_W / 2, y0 + blockH + 160)
  return toBlob(canvas)
}
