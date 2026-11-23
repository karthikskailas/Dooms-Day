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
      collectors: process.env.NITRO_PRESET?.startsWith('cloudflare') ? { driver: 'cloudflare-kv-binding', binding: 'COLLECTORS' } : { driver: 'fs', base: './.data/collectors' },
    },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Marvel: Road to Doomsday',
      meta: [
        { name: 'description', content: 'A fan-made cinematic watch journey to Avengers: Doomsday.' },
        { name: 'theme-color', content: '#0B0E0C' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Doomsday Tracker' },
        { property: 'og:title', content: 'Doomsday Tracker: what to watch before Avengers: Doomsday' },
        { property: 'og:description', content: 'Walk the road to Avengers: Doomsday in order, track what you have watched and collect an achievement card for every title.' },
        { property: 'og:image', content: 'https://doomsday-tracker-app.pages.dev/og.jpg' },
        { name: 'twitter:card', content: 'summary_large_image' },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      // Microsoft Clarity analytics.
      script: [
        {
          innerHTML:
            '(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","zi5nwf1xao");',
        },
      ],
    },
  },
})
