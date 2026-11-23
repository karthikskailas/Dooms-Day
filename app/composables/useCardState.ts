// Achievement-card state that lives apart from viewing progress: which cards the player has opened (the door
// scene plays once per card) and a collector code, unique to this browser, printed on every card they make.
const KEY = 'marvel-roadmap:cards:v1'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I

interface CardState {
  opened: string[]
  collector: string
}

function makeCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(5))
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

function read(): CardState {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? 'null') as Partial<CardState> | null
    const opened = Array.isArray(raw?.opened) ? raw.opened.filter((x): x is string => typeof x === 'string') : []
    const collector = typeof raw?.collector === 'string' && /^[A-Z2-9]{5}$/.test(raw.collector) ? raw.collector : makeCode()
    return { opened, collector }
  } catch {
    return { opened: [], collector: makeCode() }
  }
}

export function useCardState() {
  const state = useState<CardState>('card-state', () => ({ opened: [], collector: '' }))
  const ready = useState('card-state-ready', () => false)

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state.value))
    } catch {
      // Storage blocked: the state lasts until the page closes.
    }
  }

  /** Loads saved state (client only). Safe to call more than once. */
  function hydrate() {
    if (!import.meta.client || ready.value) return
    state.value = read()
    ready.value = true
    save()
  }

  return {
    ready: readonly(ready),
    collector: computed(() => state.value.collector),
    isOpened: (id: string) => state.value.opened.includes(id),
    open(id: string) {
      if (!state.value.opened.includes(id)) state.value = { ...state.value, opened: [...state.value.opened, id] }
      save()
    },
    hydrate,
  }
}
