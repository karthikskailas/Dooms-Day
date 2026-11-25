// The intro video is fetched whole into memory and played from a blob URL. The static host answers range requests with the
// full file (no 206), which iPhones refuse to play from, and the file otherwise only starts downloading when the video
// element appears. Call preloadIntro() as early as the player's choice is known (the name prompt); MapIntro awaits the same promise.
let pending: Promise<string> | null = null

export const introSrc = () => (window.matchMedia('(min-width: 768px)').matches ? '/media/intro-1080.mp4' : '/media/intro-720.mp4')

export function preloadIntro(): Promise<string> {
  pending ??= fetch(introSrc())
    .then((r) => {
      if (!r.ok) throw new Error(`intro ${r.status}`)
      return r.blob()
    })
    .then((b) => URL.createObjectURL(b))
    .catch((e) => {
      pending = null // allow a retry
      throw e
    })
  return pending
}
