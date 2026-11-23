import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-21',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint'],
  // Self-hosted fonts (no third-party font requests). Display: Barlow Condensed 600/700. UI/body: DM Sans variable.
  css: [
    '@fontsource-variable/dm-sans',
    '@fontsource/barlow-condensed/600.css',
    '@fontsource/barlow-condensed/700.css',
    '~/assets/css/main.css',
  ],
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
    // TMDB API base URL. Only api.tmdb.org and api.themoviedb.org are accepted (the token is sent there).
    tmdbApiBaseUrl: 'https://api.tmdb.org/3',
    public: {
      tmdbRegion: 'IN',
    },
  },
  // TMDB responses are cached in process memory: cleared on restart, not shared between instances.
  nitro: {
    // Collector codes must outlive a restart: Cloudflare KV when deployed (binding COLLECTORS, see wrangler.jsonc), a
    // folder on disk (.data/collectors, git-ignored) when developing or running the Node build.
    storage: {
      cache: { driver: 'memory' },
      collectors: process.env.NITRO_PRESET === 'cloudflare_module' ? { driver: 'cloudflare-kv-binding', binding: 'COLLECTORS' } : { driver: 'fs', base: './.data/collectors' },
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
