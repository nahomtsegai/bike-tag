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
      <HowItWorks />
    </div>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #ffffff;
  color: #111827;
}

.pageContent {
  margin: 0 auto;
  max-width: 1120px;
  padding: 0 1rem 4rem;
}

@media (min-width: 760px) {
  .pageContent {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
}
</style>