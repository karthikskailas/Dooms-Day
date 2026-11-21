// The roadmap collection metadata (target title, release date, definitions) from the editorial JSON.
// A named import keeps only this small object in the client bundle, not the full title list.
import { collection } from '../constant/marvel_doomsday_watchlist.json'
import type { CollectionMeta } from '../../shared/types/roadmap.ts'

// Shape and values are checked by `pnpm validate:data` (and again by the build), so this cast is safe.
export const collectionMeta = collection as CollectionMeta
