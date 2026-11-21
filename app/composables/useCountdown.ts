import { computed, onBeforeUnmount, onMounted, ref, toValue, type MaybeRefOrGetter } from 'vue'
import { getCountdown, msUntilNextSecond, parseReleaseDate, type CountdownState } from '../utils/countdown.ts'

/** `pending` until the component has mounted in the browser: the server never renders a clock reading. */
export type LiveCountdown = CountdownState | { status: 'pending' }

/**
 * A live countdown to a YYYY-MM-DD date. Server render and first client render are both `pending`, so they match
 * and there is no hydration mismatch. Ticks align to the clock's whole seconds, pause while the tab is hidden, and
 * stop once the date is reached or found invalid.
 */
export function useCountdown(targetDate: MaybeRefOrGetter<string>) {
  const now = ref<number | null>(null)
  const target = computed(() => parseReleaseDate(toValue(targetDate)))
  let timer: ReturnType<typeof setTimeout> | undefined

  const stop = () => {
    clearTimeout(timer)
    timer = undefined
  }

  const tick = () => {
    const current = Date.now()
    now.value = current
    // Nothing left to count: leave the final state on screen and stop the timer.
    if (getCountdown(target.value, current).status === 'running') {
      timer = setTimeout(tick, msUntilNextSecond(current))
    }
  }

  const onVisibilityChange = () => {
    stop()
    if (!document.hidden) tick()
  }

  onMounted(() => {
    tick()
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onBeforeUnmount(() => {
    stop()
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  const state = computed<LiveCountdown>(() =>
    now.value === null ? { status: 'pending' } : getCountdown(target.value, now.value),
  )

  return { state }
}
