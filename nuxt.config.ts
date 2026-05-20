export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',

  runtimeConfig: {
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    supabaseStorageBucket: 'bike_tag_photos',
    public: {
      supabaseAnonKey: ''
    }
  }
})