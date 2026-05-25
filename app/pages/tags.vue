<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTagApi, type FoundTagApiResponse } from '../composables/useTagApi'

const { fetchFoundTags } = useTagApi()

const searchQuery = ref('')

const {
  data: foundTags,
  pending,
  error
} = await useAsyncData<FoundTagApiResponse[]>('found-tags-page', () => {
  return fetchFoundTags()
})

const filteredTags = computed(() => {
  const normalizedSearchQuery = searchQuery.value.trim().toLowerCase()
  const tags = foundTags.value ?? []

  if (!normalizedSearchQuery) {
    return tags
  }

  return tags.filter((tag) => {
    const searchableTagText = [
      tag.title,
      tag.clue,
      tag.foundBy,
      tag.createdAt,
      tag.status
    ]
      .join(' ')
      .toLowerCase()

    return searchableTagText.includes(normalizedSearchQuery)
  })
})

const hasFoundTags = computed(() => {
  return Boolean(foundTags.value?.length)
})

const hasFilteredTags = computed(() => {
  return Boolean(filteredTags.value.length)
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Previous tags</p>

        <h1 class="pageTitle">Every found tag tells part of the ride.</h1>

        <p class="pageIntro">
          Browse the tag history, revisit found locations, and see how the game
          has moved around.
        </p>
      </section>

      <section class="searchSection" aria-label="Search previous tags">
        <label for="tagSearch">Search previous tags</label>

        <input
          id="tagSearch"
          v-model="searchQuery"
          type="search"
          placeholder="Search by title, clue, rider, date, or status"
        />
      </section>

      <AppStateMessage
        v-if="pending"
        variant="loading"
        message="Loading previous tags..."
      />

      <AppStateMessage
        v-else-if="error"
        variant="error"
        title="Could not load previous tags"
        message="Try refreshing the page. If this keeps happening, the tag history may need a quick check."
      />

      <AppStateMessage
        v-else-if="!hasFoundTags"
        variant="empty"
        eyebrow="No previous tags"
        title="No tags have been found yet."
        message="Once the first tag is approved, it will show up here."
        action-label="View current tag"
        action-to="/current-tag"
      />

      <AppStateMessage
        v-else-if="!hasFilteredTags"
        variant="empty"
        eyebrow="No search results"
        title="No tags matched your search."
        message="Try searching by a different rider, clue, date, title, or status."
      />

      <RecentTagsList
        v-else
        :tags="filteredTags"
      />
    </div>
  </main>
</template>

<style scoped>
.searchSection {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

label {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
}

input {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 1rem;
  color: var(--color-text);
  font-size: 1rem;
  line-height: 1.4;
  min-height: 3.25rem;
  padding: 0.95rem 1rem;
  width: 100%;
}

input::placeholder {
  color: var(--color-subtle);
}

input:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}
</style>