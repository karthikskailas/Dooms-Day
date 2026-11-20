// Loads saved progress once the app has mounted, so hydration never mismatches the server-rendered HTML.
export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('app:mounted', () => useProgress().hydrate())
})
