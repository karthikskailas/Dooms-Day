// The full editorial dataset for the map. Read-only. `pnpm validate:data` (also run by the build) checks its
// shape, so this cast is safe, as in collection.ts.
import dataset from '../constant/marvel_doomsday_watchlist.json'
import type { RoadmapDataset } from '../../shared/types/roadmap.ts'

export const roadmap = dataset as unknown as RoadmapDataset
