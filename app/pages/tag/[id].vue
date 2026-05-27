<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCurrentTagTimer } from '../../composables/useCurrentTagTimer'
import {
  useTagApi,
  type TagDetailApiResponse
} from '../../composables/useTagApi'
import { createMapUrl } from '../../utils/mapLinks'

const route = useRoute()
const { fetchTagById } = useTagApi()

const tagId = computed(() => {
  return String(route.params.id)
})

const {
  data: tag,
  pending,
  error
} = await useAsyncData<TagDetailApiResponse>(
  () => {
    return `tag-detail-${tagId.value}`
  },
  () => {
    return fetchTagById(tagId.value)
  },
  {
    watch: [tagId]
  }
)

const isActiveTag = computed(() => {
  return tag.value?.status === 'active'
})

const isFoundTag = computed(() => {
  return tag.value?.status === 'found'
})

const locationMapUrl = computed(() => {
  if (!tag.value || !isFoundTag.value) {
    return ''
  }

  if (!('locationMapUrl' in tag.value)) {
    return ''
  }

  return createMapUrl(tag.value.locationMapUrl)
})

const { hasClueUnlocked, clueUnlocksInLabel } = useCurrentTagTimer(() => {
  return tag.value?.createdAtIso ?? new Date().toISOString()
})

const shouldShowClue = computed(() => {
  if (!tag.value) {
    return false
  }

  if (isFoundTag.value) {
    return true
  }

  return hasClueUnlocked.value
})

const clueText = computed(() => {
  if (!tag.value) {
    return ''
  }

  return tag.value.clue ?? ''
})

const locationSummary = computed(() => {
  if (isActiveTag.value) {
    return 'Hidden while this tag is active.'
  }

  if (locationMapUrl.value) {
    return 'Found location is available.'
  }

  return 'Found location has not been shared yet.'
})

const tagStatusSummary = computed(() => {
  if (isActiveTag.value) {
    return 'This is the live mystery spot. Find it, submit proof, and choose the next tag.'
  }

  return 'This tag has already been found and is part of the completed tag history.'
})
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <NuxtLink to="/tags" class="backLink">
        Back to found tags
      </NuxtLink>

      <AppStateMessage
        v-if="pending"
        variant="loading"
        message="Loading tag details..."
      />

      <AppStateMessage
        v-else-if="error"
        variant="error"
        title="This tag could not be loaded."
        message="The tag may have been reset, removed, or replaced by test data."
        action-label="View found tags"
        action-to="/tags"
      />

      <template v-else-if="tag">
        <section class="tagDetail">
          <div v-if="tag.imageUrl" class="tagDetailImage">
            <img :src="tag.imageUrl" :alt="tag.title" />
          </div>

          <div v-else class="tagDetailPlaceholder">
            <span>Bike photo coming soon</span>
          </div>

          <div class="tagDetailContent">
            <p class="eyebrow">{{ tag.status }}</p>
            <h1 class="pageTitle">{{ tag.title }}</h1>

            <p class="tagSummary">
              {{ tagStatusSummary }}
            </p>

            <CurrentTagTimer
              v-if="isActiveTag"
              :created-at-iso="tag.createdAtIso"
            />

            <ClueRevealStatus
              :clue="clueText"
              :is-unlocked="shouldShowClue"
              :unlocks-in-label="clueUnlocksInLabel"
              :status="tag.status"
            />

            <dl class="detailList">
              <div>
                <dt>Location</dt>
                <dd>
                  <span>{{ locationSummary }}</span>

                  <a
                    v-if="locationMapUrl"
                    :href="locationMapUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open location in Maps
                  </a>
                </dd>
              </div>

              <div>
                <dt>Rider</dt>
                <dd>{{ tag.foundBy }}</dd>
              </div>

              <div>
                <dt>Date</dt>
                <dd>{{ tag.createdAt }}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section class="detailActions" aria-label="Tag detail actions">
          <div v-if="isActiveTag" class="detailActionCard">
            <h2>Think you found it?</h2>
            <p>
              Submit your matching photo, found location, and proposed next tag
              for admin review.
            </p>

            <NuxtLink to="/submit" class="primaryButton">
              Submit your match
            </NuxtLink>
          </div>

          <div class="detailActionCard">
            <h2>Browse tag history</h2>
            <p>
              Go back to the completed tag list to compare clues, photos,
              riders, and found dates.
            </p>

            <NuxtLink to="/tags" class="secondaryButton">
              View found tags
            </NuxtLink>
          </div>

          <div class="detailActionCard">
            <h2>Explore the map</h2>
            <p>
              Open the map page to browse completed tag locations that have
              been made public.
            </p>

            <NuxtLink to="/map" class="secondaryButton">
              View map
            </NuxtLink>
          </div>
        </section>
      </template>

      <AppStateMessage
        v-else
        variant="empty"
        eyebrow="Not found"
        title="This tag does not exist."
        message="The tag may have been reset, removed, or replaced by test data."
        action-label="View found tags"
        action-to="/tags"
      />
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

.backLink:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
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

.tagSummary {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
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
  display: grid;
  gap: 0.35rem;
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

.detailActions {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.detailActionCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.detailActionCard h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.detailActionCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.detailActionCard .primaryButton,
.detailActionCard .secondaryButton {
  justify-self: start;
}

@media (min-width: 760px) {
  .detailActions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .detailActionCard {
    padding: 1.5rem;
  }
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
}
</style>