<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBikeTags } from '../composables/useBikeTags'

const { foundTags } = useBikeTags()

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

@media (min-width: 760px) {
  .searchSection {
    max-width: 520px;
  }
}
</style>