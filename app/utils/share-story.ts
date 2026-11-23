// The progress story: a 1080 x 1920 image for the Share button on the journey screens. Big "5 of 27", the player's
// name, the release countdown line, and a QR code to the site with its address printed under it.
import { renderSVG } from 'uqr'
import { collectionMeta } from './collection.ts'
import { SITE_HOST, SITE_URL } from './site.ts'
import { DIM, GOLD, PALE } from './card-layout.ts'

export interface ProgressStory {
  player: string
  watched: number
  total: number
  /** "Doomsday Journey" or "Whole Universe". */
  journey: string
  /** Title to watch next, when there is one. */
  next: string | null
  /** The yggdrasil artwork, shown dark behind everything. */
  backdrop: string
}

const W = 1080
const H = 1920

const load = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image'))
    img.src = src
  })

/** The QR code as an image: its SVG goes through a data URL so the canvas can draw it. */
async function qrImage(): Promise<HTMLImageElement> {
  const svg = renderSVG(SITE_URL, { border: 1, whiteColor: '#f2f0e8', blackColor: '#0b0e0c' })
  return load(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
}

export async function renderProgressStory(d: ProgressStory): Promise<Blob> {
  await Promise.all([document.fonts.load('700 40px "Barlow Condensed"'), document.fonts.load('600 40px "Barlow Condensed"')])
  const [tree, qr] = await Promise.all([load(d.backdrop), qrImage()])

  const c = document.createElement('canvas')
  c.width = W
  c.height = H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#0b0e0c'
  ctx.fillRect(0, 0, W, H)

  // Backdrop: the tree, cover-fitted, dimmed, with the top and bottom sinking into black.
  const k = Math.max(W / tree.width, H / tree.height)
  ctx.globalAlpha = 0.55
  ctx.drawImage(tree, (W - tree.width * k) / 2, (H - tree.height * k) / 2, tree.width * k, tree.height * k)
  ctx.globalAlpha = 1
  const shade = ctx.createLinearGradient(0, 0, 0, H)
  shade.addColorStop(0, 'rgba(11,14,12,0.9)')
  shade.addColorStop(0.35, 'rgba(11,14,12,0.25)')
  shade.addColorStop(0.7, 'rgba(11,14,12,0.55)')
  shade.addColorStop(1, 'rgba(11,14,12,0.95)')
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const text = (s: string, y: number, size: number, color: string, weight = 600, spacing = 0.1, maxW = W - 140) => {
    ctx.font = `${weight} ${size}px "Barlow Condensed", sans-serif`
    ctx.letterSpacing = `${size * spacing}px`
    ctx.fillStyle = color
    ctx.fillText(s.toUpperCase(), W / 2, y, maxW)
  }

  text("I'm walking the road to", 330, 40, GOLD, 600, 0.22)
  text(collectionMeta.target_title, 410, 92, PALE, 700, 0.04)

  text(`${d.watched} of ${d.total}`, 700, 250, PALE, 700, 0.02)
  text(`titles watched · ${d.journey}`, 820, 42, GOLD, 600, 0.16)

  // Progress bar
  const bx = 160
  const bw = W - 320
  ctx.fillStyle = 'rgba(242,240,232,0.16)'
  ctx.fillRect(bx, 880, bw, 14)
  ctx.fillStyle = '#4fd07f'
  ctx.fillRect(bx, 880, bw * Math.min(1, d.total ? d.watched / d.total : 0), 14)

  text(d.player, 990, 64, PALE, 700, 0.1)
  if (d.next) text(`Up next: ${d.next}`, 1060, 36, DIM, 600, 0.1)

  // QR code on a pale plate
  const qs = 330
  const qx = (W - qs) / 2
  const qy = 1160
  ctx.fillStyle = '#f2f0e8'
  ctx.fillRect(qx - 18, qy - 18, qs + 36, qs + 36)
  ctx.drawImage(qr, qx, qy, qs, qs)
  text('Scan to start yours', qy + qs + 70, 44, GOLD, 700, 0.18)
  text(SITE_HOST, qy + qs + 126, 36, PALE, 600, 0.06)

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'))
}
