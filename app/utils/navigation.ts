export interface NavLink {
  label: string
  to: string
}

/** Primary destinations, shared by the header and footer. Routes are fixed by docs/ui-context.md. */
export const navLinks: readonly NavLink[] = [
  { label: 'Home', to: '/' },
  { label: 'Doomsday Journey', to: '/journey/doomsday' },
  { label: 'Whole Universe', to: '/universe' },
]
