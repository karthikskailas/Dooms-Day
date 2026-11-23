// Achievement-card state that lives apart from viewing progress: which cards the player has opened (the door
// scene plays once per card) and the collector code, unique to this player and registered on the server so that
// no other player ever gets the same one. The code is printed on every card they make.
const KEY = 'marvel-roadmap:cards:v1'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

interface CardState {
  opened: string[]
  collector: string
  /** Running collector number from the server (the 42nd player is 42); null until registered. */
  number: number | null
}

const makeCode = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => ALPHABET[b % ALPHABET.length]).join('')

function read(): Partial<CardState> {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<CardState> | null
    return {
      opened: Array.isArray(raw?.opened) ? raw.opened.filter((x): x is string => typeof x === 'string') : [],
      collector: typeof raw?.collector === 'string' && /^[A-Z2-9]{5}$/.test(raw.collector) ? raw.collector : undefined,
      number: typeof raw?.number === 'number' ? raw.number : null,
    }
  } catch {
    return { opened: [], number: null }
  }
}

export function useCardState() {
  const state = useState<CardState>('card-state', () => ({ opened: [], collector: '', number: null }))
  const ready = useState('card-state-ready', () => false)
  let starting = false

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.value))
    } catch {
      // Storage blocked: the state lasts until the page closes.
    }
  }

  /** Loads saved state and makes sure the collector code is registered on the server. Client only; safe to repeat. */
  async function hydrate() {
    if (!import.meta.client || ready.value || starting) return
    starting = true
    const saved = read()
    state.value = { opened: saved.opened ?? [], collector: saved.collector ?? '', number: saved.number ?? null }
    // A code (or its number) the server has not seen yet is registered now; a new player gets one from the server.
    if (!saved.collector || saved.number === null) {
      try {
        const r = await $fetch<{ code: string; number: number }>('/api/collector', { method: 'POST', body: { code: saved.collector }, timeout: 4000 })
        state.value = { ...state.value, collector: r.code, number: r.number }
      } catch {
        // Offline or no server: use a local code, register it next time.
        if (!state.value.collector) state.value = { ...state.value, collector: makeCode() }
      }
    }
    ready.value = true
    save()
  }

  return {
    ready: readonly(ready),
    collector: computed(() => state.value.collector),
    number: computed(() => state.value.number),
    isOpened: (id: string) => state.value.opened.includes(id),
    open(id: string) {
      if (!state.value.opened.includes(id)) state.value = { ...state.value, opened: [...state.value.opened, id] }
      save()
    },
    hydrate,
  }
}
