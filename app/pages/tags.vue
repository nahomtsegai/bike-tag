<script setup lang="ts">
import { mockTags } from '../data/mockTags'

const foundTags = mockTags.filter((tag) => tag.status === 'found')
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="tagsHero">
        <p class="eyebrow">Previous tags</p>
        <h1>Where the game has been.</h1>
        <p>
          Browse past Bike Tag locations and see the places riders have already found.
        </p>
      </section>

      <RecentTagsList :tags="foundTags" />
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

.tagsHero {
  background: linear-gradient(135deg, #f0fdf4, #eff6ff);
  border: 1px solid #dbeafe;
  border-radius: 1.5rem;
  padding: 2rem 1.25rem;
}

.eyebrow {
  color: #047857;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
}

h1 {
  color: #111827;
  font-size: clamp(2.25rem, 11vw, 4.5rem);
  line-height: 0.95;
  margin: 0;
}

.tagsHero p {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.65;
  margin: 1rem 0 0;
}

@media (min-width: 760px) {
  .pageContent {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .tagsHero {
    border-radius: 2rem;
    padding: 4rem 2rem;
  }
}
</style>