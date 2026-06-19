<script setup lang="ts">
type RouteSeoConfig = {
  title: string
  description: string
  noindex?: boolean
}

const siteName = 'Louisville Bike Tag'
const siteUrl = 'https://www.louisvillebiketag.com'
const route = useRoute()

const defaultSeo: RouteSeoConfig = {
  title: siteName,
  description:
    'Join Louisville Bike Tag, a community cycling photo game where riders find the current tag, submit a matching photo, and hide the next mystery location.'
}

const routeSeoByPath: Record<string, RouteSeoConfig> = {
  '/': defaultSeo,
  '/current-tag': {
    title: `Current Tag | ${siteName}`,
    description:
      'See the current Louisville Bike Tag photo and clue, then ride out and find the location.'
  },
  '/tags': {
    title: `Completed Tags | ${siteName}`,
    description:
      'Browse completed Louisville Bike Tag locations, riders, clues, and photos from previous rounds.'
  },
  '/map': {
    title: `Bike Tag Map | ${siteName}`,
    description:
      'Explore completed Louisville Bike Tag locations across the city on an interactive map.'
  },
  '/rules': {
    title: `How to Play | ${siteName}`,
    description:
      'Learn the Louisville Bike Tag rules: find the current location, match the photo, and hide the next tag.'
  },
  '/settings': {
    title: `Settings | ${siteName}`,
    description: 'Choose your Louisville Bike Tag appearance preferences.'
  },
  '/submit': {
    title: `Submit a Bike Tag | ${siteName}`,
    description:
      'Submit your matching photo and create the next Louisville Bike Tag location for other riders to find.'
  },
  '/submission-status': {
    title: `Submission Status | ${siteName}`,
    description: 'Check the review status of a Louisville Bike Tag submission.',
    noindex: true
  },
  '/submit/success': {
    title: `Submission Received | ${siteName}`,
    description: 'Save your Louisville Bike Tag reference and review your submission details.',
    noindex: true
  }
}

const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')

const routeSeo = computed<RouteSeoConfig>(() => {
  if (normalizedPath.value.startsWith('/admin')) {
    return {
      title: `Bike Tag Admin | ${siteName}`,
      description: 'Administrative tools for reviewing Louisville Bike Tag submissions.',
      noindex: true
    }
  }

  if (/^\/tags\/[^/]+$/.test(normalizedPath.value)) {
    return {
      title: `Bike Tag Details | ${siteName}`,
      description: 'View the photos, clue, rider, and location details for a completed Louisville Bike Tag.'
    }
  }

  return routeSeoByPath[normalizedPath.value] ?? defaultSeo
})

const canonicalUrl = computed(() => {
  if (normalizedPath.value === '/') {
    return siteUrl
  }

  return `${siteUrl}${normalizedPath.value}`
})

useSeoMeta({
  title: () => routeSeo.value.title,
  description: () => routeSeo.value.description,
  ogTitle: () => routeSeo.value.title,
  ogDescription: () => routeSeo.value.description,
  ogUrl: () => canonicalUrl.value,
  twitterTitle: () => routeSeo.value.title,
  twitterDescription: () => routeSeo.value.description,
  robots: () => (routeSeo.value.noindex ? 'noindex, nofollow' : 'index, follow')
})

useHead(() => ({
  link: [
    {
      rel: 'canonical',
      href: canonicalUrl.value
    }
  ]
}))
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />

    <a class="skipLink" href="#main-content">
      Skip to main content
    </a>

    <div id="main-content" tabindex="-1">
      <NuxtPage />
    </div>

    <AppFooter />
  </div>
</template>

<style>
.skipLink {
  background: var(--color-primary);
  border: 2px solid var(--color-page);
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgb(15 23 42 / 20%);
  color: var(--color-primary-text);
  font-weight: 900;
  left: 0.75rem;
  padding: 0.75rem 1rem;
  position: fixed;
  text-decoration: none;
  top: 0.75rem;
  transform: translateY(-200%);
  transition: transform 120ms ease-out;
  z-index: 1000;
}

.skipLink:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  transform: translateY(0);
}
</style>
