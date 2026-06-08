export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: {
    enabled: true
  },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'Louisville Bike Tag',
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        {
          name: 'description',
          content:
            'Join Louisville Bike Tag, a community cycling photo game where riders find the current tag, submit a matching photo, and hide the next mystery location.'
        },
        {
          name: 'theme-color',
          content: '#0f766e'
        },
        {
          property: 'og:title',
          content: 'Louisville Bike Tag'
        },
        {
          property: 'og:description',
          content:
            'A community cycling photo tag game in Louisville, Kentucky. Find the current tag, submit a matching photo, and hide the next mystery location.'
        },
        {
          property: 'og:type',
          content: 'website'
        },
        {
          property: 'og:url',
          content: 'https://www.louisvillebiketag.com'
        },
        {
          property: 'og:site_name',
          content: 'Louisville Bike Tag'
        },
        {
          property: 'og:image',
          content: 'https://www.louisvillebiketag.com/og-image.png'
        },
        {
          property: 'og:image:width',
          content: '1200'
        },
        {
          property: 'og:image:height',
          content: '630'
        },
        {
          property: 'og:image:alt',
          content: 'Louisville Bike Tag'
        },
        {
          name: 'twitter:card',
          content: 'summary_large_image'
        },
        {
          name: 'twitter:title',
          content: 'Louisville Bike Tag'
        },
        {
          name: 'twitter:description',
          content: 'Find the tag. Ride the city. Hide the next one.'
        },
        {
          name: 'twitter:image',
          content: 'https://www.louisvillebiketag.com/og-image.png'
        },
        {
          name: 'twitter:image:alt',
          content: 'Louisville Bike Tag'
        }
      ],
      link: [
        {
          rel: 'canonical',
          href: 'https://www.louisvillebiketag.com'
        }
      ]
    }
  },
  runtimeConfig: {
    tagDataSource: 'mock',
    submitRateLimitAttempts: 10,
    submitRateLimitWindowMs: 10 * 60 * 1000,
    adminApiToken: '',
    supabaseUrl: '',
    supabaseServiceRoleKey: '',
    supabaseStorageBucket: 'bike_tag_photos',
    resendApiKey: '',
    adminNotificationEmail: '',
    fromEmail: '',
    public: {
      supabaseAnonKey: '',
      siteUrl: ''
    }
  }
})