import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-21',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
  },
  typescript: {
    strict: true,
    typeCheck: false, // run explicitly via `pnpm typecheck`
  },
  // Server-only values are overridden by NUXT_* env vars at runtime; see .env.example.
  runtimeConfig: {
    tmdbApiToken: '',
    public: {
      tmdbRegion: 'IN',
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Marvel: Road to Doomsday',
      meta: [
        { name: 'description', content: 'A fan-made cinematic watch journey to Avengers: Doomsday.' },
        { name: 'theme-color', content: '#0B0E0C' },
      ],
    },
  },
})
