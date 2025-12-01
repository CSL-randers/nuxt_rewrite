// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@vueuse/nuxt'
  ],

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
})