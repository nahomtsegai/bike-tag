<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrentTagTimer } from '../../composables/useCurrentTagTimer'
import { useBikeTags } from '../../composables/useBikeTags'
import { createMapSearchUrl } from '../../utils/mapLinks'

const route = useRoute()
const { currentTag, foundTags } = useBikeTags()

const tag = computed(() => {
  const tagId = String(route.params.id)

  return [currentTag.value, ...foundTags.value].find((bikeTag) => {
    return bikeTag?.id === tagId
  })
})

const locationMapUrl = computed(() => {
  return tag.value?.locationName
    ? createMapSearchUrl(tag.value.locationName)
    : ''
})

const { hasClueUnlocked, clueUnlocksInLabel } = useCurrentTagTimer(() => {
  return tag.value?.createdAtIso ?? new Date().toISOString()
})

const shouldShowClue = computed(() => {
  return tag.value?.status === 'found' || hasClueUnlocked.value
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <NuxtLink to="/tags" class="backLink">
        Back to tags
      </NuxtLink>

      <section v-if="tag" class="tagDetail">
        <div v-if="tag.imageUrl" class="tagDetailImage">
          <img :src="tag.imageUrl" :alt="tag.title" />
        </div>

        <div v-else class="tagDetailPlaceholder">
          <span>Bike photo coming soon</span>
        </div>

        <div class="tagDetailContent">
          <p class="eyebrow">{{ tag.status }}</p>
          <h1 class="pageTitle">{{ tag.title }}</h1>

          <CurrentTagTimer
            v-if="tag.status === 'active'"
            :created-at-iso="tag.createdAtIso"
          />

          <ClueRevealStatus
            :clue="tag.clue"
            :is-unlocked="shouldShowClue"
            :unlocks-in-label="clueUnlocksInLabel"
            :status="tag.status"
          />

          <dl class="detailList">
            <div>
              <dt>Location</dt>
              <dd>
                <span v-if="tag.status === 'active'">
                  Hidden until found
                </span>

                <a
                  v-else-if="locationMapUrl"
                  :href="locationMapUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ tag.locationName }}
                </a>

                <span v-else>
                  Not shared yet
                </span>
              </dd>
            </div>

            <div>
              <dt>Found by</dt>
              <dd>{{ tag.foundBy }}</dd>
            </div>

            <div>
              <dt>Date</dt>
              <dd>{{ tag.createdAt }}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section v-else class="notFoundState">
        <p class="eyebrow">Not found</p>
        <h1 class="pageTitle">This tag does not exist.</h1>
        <p class="pageIntro">
          The tag may have been reset, removed, or replaced by local test data.
        </p>

        <NuxtLink to="/tags" class="primaryButton">
          View previous tags
        </NuxtLink>
      </section>
    </div>
  </main>
</template>

<style scoped>
.backLink {
  color: var(--color-muted);
  display: inline-flex;
  font-weight: 900;
  margin: 0.5rem 0 1rem;
  text-decoration: none;
}

.backLink:hover {
  color: var(--color-text);
}

.tagDetail {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  overflow: hidden;
}

.tagDetailImage,
.tagDetailPlaceholder {
  min-height: 280px;
}

.tagDetailImage {
  background: var(--color-surface-muted);
}

.tagDetailImage img {
  display: block;
  height: 100%;
  max-height: 520px;
  object-fit: cover;
  width: 100%;
}

.tagDetailPlaceholder {
  align-items: center;
  background: var(--color-surface-muted);
  color: var(--color-subtle);
  display: flex;
  font-weight: 900;
  justify-content: center;
}

.tagDetailContent {
  display: grid;
  gap: 1rem;
  padding: 1.5rem;
}

.detailList {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 1rem;
  margin: 0;
  padding-top: 1.5rem;
}

.detailList div {
  display: grid;
  gap: 0.25rem;
}

dt {
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dd {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

dd a {
  color: var(--color-text);
  font-weight: 900;
  text-decoration: underline;
  text-underline-offset: 0.2rem;
}

dd a:hover {
  color: var(--color-accent);
}

.notFoundState {
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.5rem;
  padding: 2rem 1.25rem;
}

.notFoundState .primaryButton {
  display: inline-flex;
  margin-top: 1.5rem;
}

@media (min-width: 900px) {
  .tagDetail {
    display: grid;
    grid-template-columns: 1.15fr 0.85fr;
  }

  .tagDetailImage,
  .tagDetailPlaceholder {
    min-height: 520px;
  }

  .tagDetailContent {
    padding: 2rem;
  }

  .notFoundState {
    padding: 3rem 2rem;
  }
}
</style>