<script setup lang="ts">
import frame from '../../assets/cards/frame.webp'
import ring from '../../assets/cards/ring.webp'
import knight from '../../assets/cards/knight.webp'
import { cardFilter, dominantHue, type CardPriority } from '../../utils/card-theme.ts'
import { CARD, CARD_H, CARD_W, DIM, GOLD, PALE, VIEW, pad, serialOf, taglineFit, titleSize } from '../../utils/card-layout.ts'

// One collectible, built for one title. Everything is laid out in the 810 x 1080 space of the owner's card design
// (Canva export): positions are percentages of that space and text sizes use container units, so the card scales as
// one piece. The frame turns toward the title's own artwork (dominant hue of its poster); priority sets how rich
// the finish is. A card's look is therefore different for every title, from the same frame.
const props = defineProps<{
  title: string
  /** Step number on the route. */
  order: number
  year: number
  /** This player's collector code; makes the serial theirs. */
  collector: string
  type: string
  priority: CardPriority
  /** The one line under the name and date. */
  tagline: string
  /** Main characters, from the roadmap data. */
  featuring: string[]
  player: string
  /** Already formatted, e.g. "27 NOV 2026". */
  date: string
  /** TMDB poster URL; the knight is used without one. */
  art?: string | null
  locked?: boolean
  /** Plays the unlock animation; change the value to play it again. */
  reveal?: number
  /** With `reveal`: only the flash and light sweep, no swing (used after the doors open). */
  flashOnly?: boolean
}>()
const emit = defineEmits<{ hue: [hue: number | null] }>()

// Sample the poster's dominant hue once it loads (needs CORS; falls back to the original gold and green).
const hue = ref<number | null>(null)
watch(
  () => props.art,
  (url) => {
    hue.value = null
    emit('hue', null)
    if (!url || !import.meta.client) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        hue.value = dominantHue(img)
      } catch {
        hue.value = null
      }
      emit('hue', hue.value)
    }
    img.src = url
  },
  { immediate: true },
)

const filter = computed(() => cardFilter(hue.value, props.priority))
const serial = computed(() => serialOf(props.order, props.collector))
const fit = computed(() => taglineFit(props.tagline))
const cast = computed(() => props.featuring.slice(0, 3).join(' · '))

const px = (v: number, of: number) => `${(v / of) * 100}%`
const box = (b: { x: number; y: number; w: number; h: number }) => ({ left: px(b.x, CARD_W), top: px(b.y, CARD_H), width: px(b.w, CARD_W), height: px(b.h, CARD_H) })
const cq = (units: number) => `${(units / CARD_W) * 100}cqw`
const side = (s: { cx: number; cy: number; w: number }) => ({ left: px(s.cx, CARD_W), top: px(s.cy, CARD_H), width: px(s.w, CARD_W), marginLeft: px(-s.w / 2, CARD_W) })
</script>

<template>
  <figure
    class="relative isolate w-full select-none overflow-hidden text-ink"
    :style="{ aspectRatio: `${VIEW.w} / ${VIEW.h}` }"
    :class="reveal && !flashOnly ? 'card-unlock' : ''"
    :aria-label="`Achievement card: ${title}, step ${order}${locked ? ', locked' : ''}`"
  >
    <!-- The design is laid out in 810 x 1080 units; this crops it to the card's own outline. -->
    <div
      class="absolute [container-type:inline-size]"
      :style="{ left: `${(-VIEW.x / VIEW.w) * 100}%`, top: `${(-VIEW.y / VIEW.h) * 100}%`, width: `${(CARD_W / VIEW.w) * 100}%`, height: `${(CARD_H / VIEW.h) * 100}%` }"
    >
    <div class="absolute inset-0" :class="locked ? 'grayscale brightness-50' : ''" :style="{ filter: locked ? undefined : filter }">
      <!-- Character window -->
      <div class="absolute overflow-hidden bg-black" :style="box(CARD.window)">
        <img :src="knight" alt="" class="absolute max-w-none" :style="{ left: px(-CARD.window.x, CARD.window.w), top: px(-CARD.window.y, CARD.window.h), width: px(CARD_W, CARD.window.w), height: px(CARD_H, CARD.window.h) }" draggable="false">
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
    <p class="absolute inset-x-0 text-center font-display font-semibold uppercase tracking-[0.18em]" :style="{ top: px(CARD.header.y, CARD_H), fontSize: cq(CARD.header.size), color: GOLD }">
      Road to Doomsday
    </p>
    <p class="absolute origin-center -rotate-90 whitespace-nowrap text-center font-display font-semibold uppercase tracking-[0.14em]" :style="{ ...side(CARD.titleSide), fontSize: cq(titleSize(title)), color: GOLD }">
      {{ locked ? '— Locked —' : title }}
    </p>
    <p class="absolute origin-center rotate-90 whitespace-nowrap text-center font-display font-semibold uppercase tracking-[0.14em]" :style="{ ...side(CARD.serialSide), fontSize: cq(CARD.serialSide.size), color: GOLD }">
      {{ serial }}
    </p>
    <p
      class="absolute -translate-x-1/2 -translate-y-1/2 text-center font-display font-bold [text-shadow:0_2px_6px_#000]"
      :style="{ left: px(CARD.step.cx, CARD_W), top: px(CARD.step.cy, CARD_H), fontSize: cq(CARD.step.size), color: PALE }"
    >
      {{ pad(order, 2) }}
    </p>
    <div class="absolute grid grid-cols-2 items-center text-center font-display font-semibold uppercase tracking-[0.12em]" :style="{ ...box(CARD.nameDate), fontSize: cq(CARD.nameDate.size), color: PALE }">
      <span class="truncate px-[3cqw]">{{ locked ? '—' : player }}</span>
      <span class="truncate px-[3cqw]">{{ locked ? '—' : date }}</span>
    </div>
    <p class="absolute flex items-center justify-center font-display font-semibold uppercase tracking-[0.2em]" :style="{ ...box(CARD.label), fontSize: cq(CARD.label.size), color: GOLD }">
      <span v-if="locked">Unlock to reveal</span>
      <span v-for="(l, i) in fit.lines" v-else :key="i" class="block whitespace-nowrap" :style="{ fontSize: cq(fit.size) }">{{ l }}</span>
    </p>
    <p class="absolute flex flex-col items-center justify-center text-center font-display uppercase leading-snug tracking-[0.16em]" :style="{ ...box(CARD.foot), fontSize: cq(CARD.foot.size), color: DIM }">
      <template v-if="locked">Mark this title watched to unlock</template>
      <template v-else>
        <span class="max-w-full truncate" style="color: #c9a45a">{{ cast }}</span>
        <span>{{ type }} · {{ year }}</span>
      </template>
    </p>

    <!-- Unlock flash and light sweep -->
    <div v-if="reveal" class="card-flash pointer-events-none absolute inset-0" aria-hidden="true" />
    <div v-if="reveal" class="card-sweep pointer-events-none absolute inset-0" aria-hidden="true" />
    </div>
  </figure>
</template>
