<script setup lang="ts">
import { computed, ref } from 'vue'
import { mockTags } from '../data/mockTags'

const searchQuery = ref('')

const foundTags = computed(() => {
  return mockTags.filter((tag) => tag.status === 'found')
})

const filteredTags = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  if (!query) {
    return foundTags.value
  }

  return foundTags.value.filter((tag) => {
    const searchableText = [
      tag.title,
      tag.clue,
      tag.locationName,
      tag.foundBy,
      tag.createdAt
    ]
      .join(' ')
      .toLowerCase()

    return searchableText.includes(query)
  })
})
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

      <section class="searchSection" aria-label="Search previous tags">
        <label for="tagSearch">Search tags</label>

        <input
          id="tagSearch"
          v-model="searchQuery"
          type="search"
          placeholder="Search by place, rider, clue, or date"
        />

        <p class="resultCount">
          Showing {{ filteredTags.length }} of {{ foundTags.length }} tags
        </p>
      </section>

      <RecentTagsList :tags="filteredTags" />
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
  padding: 0 1rem 2rem;
}

@media (min-width: 760px) {
  .pageContent {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-bottom: 3rem;
  }
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

.searchSection {
  display: grid;
  gap: 0.65rem;
  margin-top: 1.5rem;
}

label {
  color: #111827;
  font-size: 0.95rem;
  font-weight: 900;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 999px;
  color: #111827;
  font-size: 1rem;
  padding: 1rem 1.15rem;
  width: 100%;
}

input:focus {
  border-color: #111827;
  outline: 3px solid #dbeafe;
}

.resultCount {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

@media (min-width: 760px) {
  .pageContent {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-bottom: 3rem;
  }

  .tagsHero {
    border-radius: 2rem;
    padding: 4rem 2rem;
  }

  .searchSection {
    max-width: 520px;
  }
}
</style>