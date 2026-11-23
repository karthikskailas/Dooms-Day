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
const emit = defineEmits<{ ready: [] }>()
const videoReady = ref(false)
const posterEl = ref<HTMLImageElement | null>(null)

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
      },
      // -1 unstarted / 5 cued: autoplay was ignored, so ask again.
      onStateChange: (e: { data: number }) => {
        if (e.data === -1 || e.data === 5) player.playVideo()
        // 1 = playing: only now is the video (not YouTube's own spinner) what is on screen.
        if (e.data === 1 && !videoReady.value) {
          videoReady.value = true
          emit('ready')
        }
      },
      onError: (e: { data: number }) => console.warn('[landing] YouTube player error', e.data),
    },
  })
}

onMounted(() => {
  // Phones (under 768px) show the poster and our own countdown instead, so the video is never loaded there.
  // The poster may finish loading before the page wakes up, which skips its load event, so check it here too.
  if (!window.matchMedia('(min-width: 768px)').matches) {
    if (posterEl.value?.complete && posterEl.value.naturalWidth) emit('ready')
    return
  }
  const w = window as YtWindow
  if (w.YT?.Player) return createPlayer(w.YT)
  w.onYouTubeIframeAPIReady = () => w.YT && createPlayer(w.YT)
  const script = document.createElement('script')
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.append(script)
})
</script>

<template>
  <div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">

        <img
      ref="posterEl"
      :src="poster"
      alt=""
      fetchpriority="high"
      class="absolute inset-0 size-full object-cover object-[60%_center] md:hidden"
      @load="emit('ready')"
    >

    <div
      class="absolute left-1/2 top-1/2 hidden h-[109.7vw] w-[195vw] -translate-x-1/2 -translate-y-1/2 transition-opacity duration-1000 [mask-image:linear-gradient(to_bottom,transparent,black_22%,black_78%,transparent)] md:block landscape:h-[max(100dvh,56.25vw)] landscape:w-[max(100vw,177.78dvh)] landscape:[mask-image:none] [&_iframe]:size-full [&_iframe]:border-0"
      :class="videoReady ? 'opacity-100' : 'opacity-0'"
    >
      <div ref="target" />
    </div>

    <!-- A very light overall dim over the poster or video. -->
    <div class="absolute inset-0 bg-void/20" />

    <!-- Tablet and up: only the bottom is dimmed, for the buttons; the video's own countdown is untouched. Phones: a band behind our countdown and buttons, clear of the poster's logo. -->
    <div class="absolute inset-x-0 bottom-[22%] h-[42%] bg-linear-to-t from-transparent via-void/65 to-transparent md:bottom-0 md:h-1/2 md:from-void/80 md:via-transparent md:to-transparent" />
  </div>
</template>
