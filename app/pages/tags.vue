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

const foundTagCount = computed(() => {
  return foundTags.value?.length ?? 0
})

const filteredTagCount = computed(() => {
  return filteredTags.value.length
})

const hasSearchQuery = computed(() => {
  return Boolean(searchQuery.value.trim())
})

const hasFoundTags = computed(() => {
  return foundTagCount.value > 0
})

const hasFilteredTags = computed(() => {
  return filteredTagCount.value > 0
})

const searchSummary = computed(() => {
  if (!hasFoundTags.value) {
    return ''
  }

  if (!hasSearchQuery.value) {
    return `Showing all ${foundTagCount.value} found tags.`
  }

  if (filteredTagCount.value === 1) {
    return 'Showing 1 matching tag.'
  }

  return `Showing ${filteredTagCount.value} matching tags.`
})

const searchEmptyMessage = computed(() => {
  const trimmedSearchQuery = searchQuery.value.trim()

  if (!trimmedSearchQuery) {
    return 'Try searching by rider, clue, date, title, or status.'
  }

  return `No previous tags matched “${trimmedSearchQuery}”. Try a different rider, clue, date, title, or status.`
})

const clearSearch = () => {
  searchQuery.value = ''
}
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

      <section
        v-if="hasFoundTags"
        class="historyActions"
        aria-label="Tag history actions"
      >
        <div class="historyActionCard">
          <h2>Looking for the active tag?</h2>

          <p>
            Jump back to the current tag when you are ready to ride.
          </p>

          <NuxtLink to="/current-tag" class="secondaryButton">
            View current tag
          </NuxtLink>
        </div>

        <div class="historyActionCard">
          <h2>Want the map view?</h2>

          <p>
            See found tag locations together on the map.
          </p>

          <NuxtLink to="/map" class="secondaryButton">
            View map
          </NuxtLink>
        </div>
      </section>

      <section
        v-if="hasFoundTags"
        class="searchSection"
        aria-label="Search previous tags"
      >
        <div class="searchHeader">
          <div>
            <label for="tagSearch">Search previous tags</label>

            <p class="searchHelp">
              Search by title, clue, rider, date, or status.
            </p>

            <p v-if="searchSummary" class="searchSummary">
              {{ searchSummary }}
            </p>
          </div>

          <button
            v-if="hasSearchQuery"
            class="clearSearchButton"
            type="button"
            @click="clearSearch"
          >
            Clear search
          </button>
        </div>

        <input
          id="tagSearch"
          v-model="searchQuery"
          type="search"
          placeholder="Example: bridge, rider, approved, or 2026"
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
        title="No found tags yet."
        message="Once riders find and approve tags, the full tag history will appear here."
        action-label="View current tag"
        action-to="/current-tag"
      />

      <section
        v-else-if="!hasFilteredTags"
        class="searchEmptyState"
        aria-live="polite"
      >
        <AppStateMessage
          variant="empty"
          eyebrow="No search results"
          title="No tags matched your search."
          :message="searchEmptyMessage"
        />

        <button
          class="clearSearchEmptyButton"
          type="button"
          @click="clearSearch"
        >
          Clear search
        </button>
      </section>

      <RecentTagsList
        v-else
        :tags="filteredTags"
      />
    </div>
  </main>
</template>

<style scoped>
.historyActions {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.historyActionCard,
.searchSection {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.historyActionCard h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.historyActionCard p,
.searchHelp,
.searchSummary {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.searchHelp {
  font-size: 0.95rem;
  margin-top: 0.25rem;
}

.historyActionCard .secondaryButton {
  justify-self: start;
}

.searchSection {
  margin-top: 1.5rem;
}

.searchHeader {
  align-items: start;
  display: grid;
  gap: 0.75rem;
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

.clearSearchButton,
.clearSearchEmptyButton {
  background: transparent;
  border: 0;
  color: var(--color-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 900;
  padding: 0;
  text-align: left;
}

.clearSearchButton:focus,
.clearSearchEmptyButton:focus {
  border-radius: 0.5rem;
  outline: 3px solid var(--color-focus);
  outline-offset: 0.25rem;
}

.searchEmptyState {
  display: grid;
  gap: 0.75rem;
}

.clearSearchEmptyButton {
  justify-self: start;
  margin-left: 1.25rem;
}

@media (min-width: 760px) {
  .historyActions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .historyActionCard,
  .searchSection {
    padding: 1.5rem;
  }

  .searchHeader {
    align-items: center;
    display: flex;
    justify-content: space-between;
  }

  .clearSearchEmptyButton {
    margin-left: 1.5rem;
  }
}
</style>