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
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
}

input {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  color: var(--color-text);
  font-size: 1rem;
  padding: 1rem 1.15rem;
  width: 100%;
}

input::placeholder {
  color: var(--color-subtle);
}

input:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

.resultCount {
  color: var(--color-subtle);
  font-size: 0.95rem;
  margin: 0;
}

.devTools {
  align-items: start;
  background: var(--color-surface-soft);
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.devTools h2 {
  color: var(--color-text);
  font-size: 1.15rem;
  margin: 0 0 0.35rem;
}

.devTools p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.devTools button {
  background: var(--color-primary);
  border: 0;
  border-radius: 999px;
  color: var(--color-primary-text);
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