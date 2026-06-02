<script setup lang="ts">
import { computed, ref } from 'vue'

import { useCurrentTagTimer } from '../composables/useCurrentTagTimer'
import { shareCurrentTag } from '../utils/shareCurrentTag'

import type { BikeTag } from '../data/mockTags'

const props = defineProps<{
  tag: BikeTag
}>()

const { elapsedLabel, hasClueUnlocked, clueUnlocksInLabel } =
  useCurrentTagTimer(() => props.tag.createdAtIso)

const shareStatus = ref<'idle' | 'sharing' | 'shared' | 'copied' | 'unsupported' | 'failed'>(
  'idle'
)

const locationIsHidden = computed(() => {
  return props.tag.status === 'active'
})

const currentTagShareUrl = computed(() => {
  if (!import.meta.client) {
    return '/current-tag'
  }

  return `${window.location.origin}/current-tag`
})

const shareButtonLabel = computed(() => {
  if (shareStatus.value === 'sharing') {
    return 'Sharing...'
  }

  if (shareStatus.value === 'copied') {
    return 'Link copied'
  }

  if (shareStatus.value === 'shared') {
    return 'Shared'
  }

  return 'Share current tag'
})

const shareFeedbackMessage = computed(() => {
  if (shareStatus.value === 'copied') {
    return 'Current tag link copied to your clipboard.'
  }

  if (shareStatus.value === 'shared') {
    return 'Current tag shared.'
  }

  if (shareStatus.value === 'unsupported') {
    return 'Sharing is not supported in this browser. Copy the page link from your address bar.'
  }

  if (shareStatus.value === 'failed') {
    return 'Could not share the current tag. Try copying the page link instead.'
  }

  return ''
})

const handleShareCurrentTag = async () => {
  if (shareStatus.value === 'sharing') {
    return
  }

  shareStatus.value = 'sharing'

  try {
    const result = await shareCurrentTag({
      title: 'Louisville Bike Tag',
      text: `Help find the current Bike Tag: ${props.tag.title}`,
      url: currentTagShareUrl.value
    })

    shareStatus.value = result.status

    window.setTimeout(() => {
      if (shareStatus.value === result.status) {
        shareStatus.value = 'idle'
      }
    }, 3000)
  } catch (error) {
    shareStatus.value = 'failed'

    window.setTimeout(() => {
      if (shareStatus.value === 'failed') {
        shareStatus.value = 'idle'
      }
    }, 3000)

    console.error(error)
  }
}
</script>

<template>
  <section id="current-tag" class="currentTag">
    <div class="sectionHeader">
      <div>
        <p class="eyebrow">Current tag</p>

        <h2>{{ tag.title }}</h2>
      </div>

      <div class="shareActions">
        <button
          class="secondaryButton shareButton"
          type="button"
          :disabled="shareStatus === 'sharing'"
          @click="handleShareCurrentTag"
        >
          {{ shareButtonLabel }}
        </button>

        <p
          v-if="shareFeedbackMessage"
          class="shareFeedback"
          role="status"
        >
          {{ shareFeedbackMessage }}
        </p>
      </div>
    </div>

    <article class="tagCard">
      <div v-if="tag.imageUrl" class="tagImage">
        <img :src="tag.imageUrl" :alt="tag.title">
      </div>

      <div v-else class="imagePlaceholder">
        <span>Bike photo coming soon</span>
      </div>

      <div class="tagDetails">
        <p class="status">{{ tag.status }}</p>

        <div class="metaList">
          <p>Posted by {{ tag.foundBy }}</p>

          <p>Posted on {{ tag.createdAt }}</p>
        </div>

        <CurrentTagStatusPanel
          v-if="tag.status === 'active'"
          :elapsed-label="elapsedLabel"
          :clue-is-unlocked="hasClueUnlocked"
          :clue-unlocks-in-label="clueUnlocksInLabel"
          :location-is-hidden="locationIsHidden"
        />
      </div>
    </article>
  </section>
</template>

<style scoped>
.currentTag {
  padding: 3rem 0 0;
}

.sectionHeader {
  display: grid;
  gap: 1rem;
  max-width: 720px;
}

h2 {
  color: var(--color-text);
  font-size: clamp(2rem, 8vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
}

.shareActions {
  align-items: start;
  display: grid;
  gap: 0.5rem;
}

.shareButton {
  justify-self: start;
}

.shareFeedback {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 800;
  line-height: 1.5;
  margin: 0;
}

.tagCard {
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  margin-top: 1.25rem;
  overflow: hidden;
}

.imagePlaceholder,
.tagImage {
  min-height: 260px;
}

.imagePlaceholder {
  align-items: center;
  background: var(--color-surface-muted);
  color: var(--color-subtle);
  display: flex;
  font-weight: 800;
  justify-content: center;
}

.tagImage {
  background: var(--color-surface-muted);
}

.tagImage img {
  display: block;
  height: 100%;
  max-height: 420px;
  object-fit: cover;
  width: 100%;
}

.tagDetails {
  background: var(--color-surface);
  padding: 1.5rem;
}

.status {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.metaList {
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
}

.metaList p {
  color: var(--color-muted);
  margin: 0;
}

@media (min-width: 760px) {
  .currentTag {
    padding-top: 4rem;
  }

  .sectionHeader {
    align-items: end;
    grid-template-columns: minmax(0, 1fr) auto;
    max-width: none;
  }

  .shareActions {
    justify-items: end;
    text-align: right;
  }

  .tagCard {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: 1.2fr 0.8fr;
  }

  .imagePlaceholder,
  .tagImage {
    min-height: 340px;
  }

  .tagDetails {
    padding: 2rem;
  }
}
</style>