<script setup lang="ts">
import frame from '../../assets/cards/frame.webp'
import bg from '../../assets/cards/bg.webp'
import ring from '../../assets/cards/ring.webp'
import knight from '../../assets/cards/knight.webp'

// One collectible. Everything is laid out in the 810 x 1080 space of the owner's card design (Canva export), so
// positions below are percentages of that space and text sizes use container units: the card scales as one piece.
// The frame, background and ring are layers; the character window shows the title's own artwork (or the knight).
// Priority sets the finish: essential keeps the gold and green, recommended is steel, optional is bronze.
const props = defineProps<{
  title: string
  /** Step number on the route. */
  order: number
  year: number
  priority: 'essential' | 'recommended' | 'optional'
  player: string
  /** Already formatted, e.g. "27 NOV 2026". */
  date: string
  /** TMDB poster URL; the knight is used without one. */
  art?: string | null
  locked?: boolean
}>()

const finish = {
  essential: 'none',
  recommended: 'grayscale(0.85) brightness(1.1)',
  optional: 'sepia(0.75) saturate(0.9) hue-rotate(-12deg)',
} as const
const label = { essential: 'Essential', recommended: 'Recommended', optional: 'Optional' } as const

const pad = (n: number, w: number) => String(n).padStart(w, '0')
const serial = computed(() => `ACH-${pad(props.order, 3)}-${props.year}`)
const filter = computed(() => finish[props.priority])

// Long titles shrink to fit the vertical panel.
const titleSize = computed(() => (props.title.length > 24 ? 2.1 : props.title.length > 16 ? 2.6 : 3.1))

const px = (v: number, of: number) => `${(v / of) * 100}%`
const box = (x: number, y: number, w: number, h: number) => ({ left: px(x, 810), top: px(y, 1080), width: px(w, 810), height: px(h, 1080) })
</script>

<template>
  <figure
    class="relative isolate aspect-[3/4] w-full select-none overflow-hidden bg-void text-ink [container-type:inline-size]"
    :aria-label="`Achievement card: ${title}, step ${order}${locked ? ', locked' : ''}`"
  >
    <div class="absolute inset-0" :class="locked ? 'grayscale brightness-50' : ''" :style="{ filter: locked ? undefined : filter }">
      <img :src="bg" alt="" class="absolute inset-0 size-full object-cover" draggable="false">

      <!-- Character window -->
      <div class="absolute overflow-hidden bg-black" :style="box(212, 151, 385, 524)">
        <img :src="knight" alt="" class="absolute max-w-none" :style="{ left: px(-212, 385), top: px(-151, 524), width: px(810, 385), height: px(1080, 524) }" draggable="false">
        <img
          v-if="art && !locked"
          :src="art"
          alt=""
          class="absolute inset-0 size-full object-cover [filter:saturate(0.85)_contrast(1.05)_sepia(0.25)]"
          draggable="false"
          crossorigin="anonymous"
        >
        <div class="absolute inset-0 bg-linear-to-t from-void/80 via-transparent to-void/30" />
      </div>
      <img :src="ring" alt="" class="absolute inset-0 size-full opacity-70 mix-blend-screen" draggable="false">
      <img :src="frame" alt="" class="absolute inset-0 size-full" draggable="false">
    </div>

    <!-- Text, drawn live so it stays sharp -->
    <p
      class="absolute inset-x-0 text-center font-display font-semibold uppercase tracking-[0.18em] text-[#c9a45a]"
      :style="{ top: px(103, 1080), fontSize: '3cqw' }"
    >
      Road to Doomsday
    </p>

    <p
      class="absolute origin-center -rotate-90 whitespace-nowrap text-center font-display font-semibold uppercase tracking-[0.14em] text-[#c9a45a]"
      :style="{ left: px(165, 810), top: px(405, 1080), width: px(420, 810), marginLeft: px(-210, 810), fontSize: `${titleSize}cqw` }"
    >
      {{ locked ? '— Locked —' : title }}
    </p>
    <p
      class="absolute origin-center rotate-90 whitespace-nowrap text-center font-display font-semibold uppercase tracking-[0.14em] text-[#c9a45a]"
      :style="{ left: px(645, 810), top: px(405, 1080), width: px(420, 810), marginLeft: px(-210, 810), fontSize: '2.8cqw' }"
    >
      {{ serial }}
    </p>

    <p
      class="absolute -translate-x-1/2 -translate-y-1/2 text-center font-display font-bold text-[#d8c7b0] [text-shadow:0_2px_6px_#000]"
      :style="{ left: px(405, 810), top: px(667, 1080), fontSize: '9cqw' }"
    >
      {{ pad(order, 2) }}
    </p>

    <div
      class="absolute grid grid-cols-2 items-center text-center font-display font-semibold uppercase tracking-[0.12em] text-[#d8c7b0]"
      :style="{ ...box(120, 752, 570, 56), fontSize: '3.1cqw' }"
    >
      <span class="truncate px-[3cqw]">{{ locked ? '—' : player }}</span>
      <span class="truncate px-[3cqw]">{{ locked ? '—' : date }}</span>
    </div>

    <p
      class="absolute flex items-center justify-center font-display font-semibold uppercase tracking-[0.2em] text-[#c9a45a]"
      :style="{ ...box(240, 820, 330, 64), fontSize: '2.7cqw' }"
    >
      {{ label[priority] }}
    </p>

    <p
      class="absolute text-center font-display uppercase leading-snug tracking-[0.16em] text-[#a27f3f]"
      :style="{ ...box(180, 905, 450, 70), fontSize: '2.2cqw' }"
    >
      {{ locked ? 'Mark this title watched to unlock' : 'The journey is complete. The next legend awaits.' }}
    </p>
  </figure>
</template>
