<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBikeTags } from '../composables/useBikeTags'

const { foundTags, resetLocalTags } = useBikeTags()

const searchQuery = ref('')

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

const handleResetLocalTags = () => {
  const shouldReset = window.confirm(
    'Reset local Bike Tag data and return to the mock tags?'
  )

  if (!shouldReset) {
    return
  }

  resetLocalTags()
  searchQuery.value = ''
}
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Previous tags</p>
        <h1 class="pageTitle">Where the game has been.</h1>
        <p class="pageIntro">
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

      <section class="devTools" aria-label="Developer tools">
        <div>
          <h2>Developer tools</h2>
          <p>Reset local test data and return to the mock Bike Tag state.</p>
        </div>

        <button type="button" @click="handleResetLocalTags">
          Reset local data
        </button>
      </section>

      <RecentTagsList :tags="filteredTags" />
    </div>
  </main>
</template>

<style scoped>
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

.devTools {
  align-items: start;
  background: #f9fafb;
  border: 1px dashed #d1d5db;
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.devTools h2 {
  color: #111827;
  font-size: 1.15rem;
  margin: 0 0 0.35rem;
}

.devTools p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

.devTools button {
  background: #111827;
  border: 0;
  border-radius: 999px;
  color: #ffffff;
  cursor: pointer;
  font-weight: 900;
  padding: 0.85rem 1rem;
}

@media (min-width: 760px) {
  .searchSection {
    max-width: 520px;
  }

  .devTools {
    align-items: center;
    grid-template-columns: 1fr auto;
  }
}
</style>