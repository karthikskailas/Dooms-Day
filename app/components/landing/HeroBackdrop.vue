<script setup lang="ts">
import poster from '../../assets/images/jzPwsojjFStf5lR5Nm07w2hH56G.webp'

// Original abstract artwork: nested faceted rings cut by spokes, converging on one point. No characters,
// masks or logos. Drawn as hairlines; the seams draw in once on load (see .seam-draw in main.css).
// Official live countdown to Avengers: Doomsday (YouTube f17J3AXVK5w). The countdown is the video, so the page shows nothing else.
const VIDEO_ID = 'f17J3AXVK5w'

// Minimal typing for the parts of the YouTube IFrame API used here.
interface YtPlayer {
  mute(): void
  playVideo(): void
}
interface YtApi {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YtPlayer
}
type YtWindow = Window & { YT?: YtApi; onYouTubeIframeAPIReady?: () => void }

const target = ref<HTMLElement | null>(null)
const videoReady = ref(false)

// The player script starts playback itself (muted, which browsers allow) instead of relying on the embed URL's
// autoplay flag alone, which some browser settings ignore. Always autoplays: owner directive, no reduced-motion exception.
function createPlayer(yt: YtApi) {
  if (!target.value) return
  const player: YtPlayer = new yt.Player(target.value, {
    videoId: VIDEO_ID,
    host: 'https://www.youtube-nocookie.com',
    playerVars: { autoplay: 1, mute: 1, controls: 0, disablekb: 1, playsinline: 1, rel: 0, modestbranding: 1, iv_load_policy: 3, origin: location.origin },
    events: {
      onReady: () => {
        player.mute()
        player.playVideo()
        videoReady.value = true
      },
      // -1 unstarted / 5 cued: autoplay was ignored, so ask again.
      onStateChange: (e: { data: number }) => {
        if (e.data === -1 || e.data === 5) player.playVideo()
      },
      onError: (e: { data: number }) => console.warn('[landing] YouTube player error', e.data),
    },
  })
}

onMounted(() => {
  // Portrait (phones) shows the poster and our own countdown instead, so the video is never loaded there.
  if (window.matchMedia('(orientation: portrait)').matches) return
  const w = window as YtWindow
  if (w.YT?.Player) return createPlayer(w.YT)
  w.onYouTubeIframeAPIReady = () => w.YT && createPlayer(w.YT)
  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.append(script)
})

const FOCUS = { x: 800, y: 450 }
const SIDES = 8

const point = (radius: number, degrees: number) => {
  const a = (degrees * Math.PI) / 180
  return [FOCUS.x + radius * Math.cos(a), FOCUS.y + radius * Math.sin(a)] as const
}
const fmt = (n: number) => n.toFixed(1)

// Rings widen outward and alternate their rotation, so facets never line up from one ring to the next.
const rings = Array.from({ length: 7 }, (_, i) => {
  const radius = 96 + i * 104
  const rotation = (i % 2 === 0 ? 0 : 22.5) + i * 2.5
  const d = Array.from({ length: SIDES }, (_, k) => point(radius, rotation + (360 / SIDES) * k))
    .map(([x, y], k) => `${k === 0 ? 'M' : 'L'}${fmt(x)} ${fmt(y)}`)
    .join(' ')
  return { d: `${d} Z`, strong: i < 3, opacity: Math.max(0.28, 0.95 - i * 0.12), delay: i * 130 }
})

// Spokes run along the first ring's vertices and are broken into segments, like plate seams.
const spokes = Array.from({ length: SIDES }, (_, k) => {
  const angle = (360 / SIDES) * k
  const segment = (from: number, to: number) => {
    const [x1, y1] = point(from, angle)
    const [x2, y2] = point(to, angle)
    return `M${fmt(x1)} ${fmt(y1)} L${fmt(x2)} ${fmt(y2)}`
  }
  return { d: `${segment(40, 188)} ${segment(260, 500)} ${segment(560, 760)}`, delay: 600 + k * 70 }
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMaxYMid slice"
      fill="none"
      focusable="false"
    >
      <g stroke-width="1" stroke-linejoin="round" vector-effect="non-scaling-stroke">
        <path
          v-for="(ring, i) in rings"
          :key="`ring-${i}`"
          :d="ring.d"
          pathLength="1"
          class="seam-draw"
          :style="{ '--draw-delay': `${ring.delay}ms`, strokeOpacity: ring.opacity }"
          :stroke="ring.strong ? 'var(--color-line-strong)' : 'var(--color-line)'"
        />
        <path
          v-for="(spoke, i) in spokes"
          :key="`spoke-${i}`"
          :d="spoke.d"
          pathLength="1"
          class="seam-draw"
          :style="{ '--draw-delay': `${spoke.delay}ms` }"
          stroke="var(--color-line)"
        />
      </g>
      <!-- The one gold point the whole composition converges on. -->
      <circle :cx="FOCUS.x" :cy="FOCUS.y" r="5" fill="var(--color-relic-gold)" />
      <circle :cx="FOCUS.x" :cy="FOCUS.y" r="15" stroke="var(--color-relic-gold)" stroke-opacity="0.55" stroke-width="1" />
    </svg>

        <img
      :src="poster"
      alt=""
      fetchpriority="high"
      class="absolute inset-0 size-full object-cover object-[60%_center] landscape:hidden"
    >

    <div
      class="absolute left-1/2 top-1/2 h-[max(100dvh,56.25vw)] w-[max(100vw,177.78dvh)] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 [&_iframe]:size-full [&_iframe]:border-0"
      :class="videoReady ? 'opacity-100' : 'opacity-0'"
    >
      <div ref="target" />
    </div>

    <!-- A very light overall dim over the poster or video. -->
    <div class="absolute inset-0 bg-void/20" />

    <!-- Landscape: only the bottom is dimmed, for the buttons; the video's own countdown is untouched. Portrait: a band behind our countdown and buttons, clear of the poster's logo. -->
    <div class="absolute inset-x-0 bottom-[22%] h-[42%] bg-linear-to-t from-transparent via-void/65 to-transparent landscape:inset-x-0 landscape:bottom-0 landscape:h-1/2 landscape:bg-linear-to-t landscape:from-void/80 landscape:via-transparent landscape:to-transparent" />
  </div>
</template>
