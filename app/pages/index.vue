<script setup lang="ts">
import { mockTags, type BikeTag } from '../data/mockTags'

const fallbackTag: BikeTag = {
  id: 'fallback',
  title: 'Find the overlook',
  clue: 'A quiet climb with one of the best views in the city.',
  imageUrl: '',
  locationName: 'Iroquois Park',
  foundBy: 'Sample Rider',
  createdAt: '2026 05 17',
  status: 'active'
}

const currentTag: BikeTag =
  mockTags.find((tag) => tag.status === 'active') ?? fallbackTag
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />
      <HeroSection />
      <CurrentTagCard :tag="currentTag" />
    </div>
  </main>
</template>