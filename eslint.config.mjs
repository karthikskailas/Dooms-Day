import withNuxt from './.nuxt/eslint.config.mjs'

// .claude/ holds installed third-party design skills (not project code); keep them out of lint.
export default withNuxt({ ignores: ['.claude/**', '.wrangler/**', 'dist/**'] })
