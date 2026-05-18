<script setup lang="ts">
import { computed } from 'vue'
import { useCurrentTagTimer } from '../composables/useCurrentTagTimer'
import type { BikeTag } from '../data/mockTags'

const props = defineProps<{
  tag: BikeTag
}>()

const { elapsedLabel, hasClueUnlocked, clueUnlocksInLabel } = useCurrentTagTimer(
  () => props.tag.createdAtIso
)

const shouldShowClue = computed(() => {
  return props.tag.status === 'found' || hasClueUnlocked.value
})

const locationIsHidden = computed(() => {
  return props.tag.status === 'active'
})
</script>

<template>
  <section id="current-tag" class="currentTag">
    <div class="sectionHeader">
      <p class="eyebrow">Current tag</p>
      <h2>{{ tag.title }}</h2>

      <ClueRevealStatus
        :clue="tag.clue"
        :is-unlocked="shouldShowClue"
        :unlocks-in-label="clueUnlocksInLabel"
        :status="tag.status"
      />
    </div>

    <article class="tagCard">
      <div v-if="tag.imageUrl" class="tagImage">
        <img :src="tag.imageUrl" :alt="tag.title" />
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
          :clue-is-unlocked="shouldShowClue"
          :clue-unlocks-in-label="clueUnlocksInLabel"
          :location-is-hidden="locationIsHidden"
        />

        <NuxtLink to="/submit" class="primaryButton matchButton">
          Submit your match
        </NuxtLink>
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

.matchButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  margin-top: 1.25rem;
  width: 100%;
}

@media (min-width: 760px) {
  .currentTag {
    padding-top: 4rem;
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

  .matchButton {
    width: auto;
  }
}
</style>