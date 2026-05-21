export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    tagDataSource: 'mock',
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    supabaseStorageBucket: 'bike_tag_photos',
    public: {
      supabaseAnonKey: ''
    }
  }
})