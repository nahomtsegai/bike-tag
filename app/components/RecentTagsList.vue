<script setup lang="ts">
import type { BikeTag } from '../data/mockTags'

defineProps<{
  tags: BikeTag[]
}>()
</script>

<template>
  <section id="recent-tags" class="recentTags">
    <div class="sectionHeader">
      <p class="eyebrow">Recent tags</p>
      <h2>Where the game has been.</h2>
      <p>
        Look back at recently found tags and get a feel for the places riders
        have discovered.
      </p>
    </div>

    <div v-if="tags.length" class="tagsGrid">
      <NuxtLink
        v-for="tag in tags"
        :key="tag.id"
        :to="`/tag/${tag.id}`"
        class="tagPreviewCard"
      >
        <div v-if="tag.imageUrl" class="tagPreviewImage">
          <img :src="tag.imageUrl" :alt="tag.title" />
        </div>

        <div v-else class="imagePlaceholder">
          <span>Photo</span>
        </div>

        <div class="cardBody">
          <p class="status">{{ tag.status }}</p>
          <h3>{{ tag.title }}</h3>
          <p class="clue">{{ tag.clue }}</p>

          <div class="metaList">
            <p>{{ tag.locationName }}</p>
            <p>Found by {{ tag.foundBy }}</p>
            <p>{{ tag.createdAt }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>

    <div v-else class="emptyState">
      <h3>No tags found</h3>
      <p>Try searching for a different place, rider, clue, or date.</p>
    </div>
  </section>
</template>

<style scoped>
.recentTags {
  padding: 3rem 0 0;
}

.sectionHeader {
  max-width: 720px;
}

h2 {
  color: var(--color-text);
  font-size: clamp(2rem, 8vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
}

.sectionHeader p {
  color: var(--color-muted);
  font-size: 1rem;
  line-height: 1.65;
}

.tagsGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.tagPreviewCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  color: inherit;
  overflow: hidden;
  text-decoration: none;
}

.tagPreviewCard:hover {
  border-color: var(--color-primary);
}

.imagePlaceholder,
.tagPreviewImage {
  min-height: 180px;
}

.imagePlaceholder {
  align-items: center;
  background: var(--color-surface-muted);
  color: var(--color-subtle);
  display: flex;
  font-weight: 800;
  justify-content: center;
}

.tagPreviewImage {
  background: var(--color-surface-muted);
}

.tagPreviewImage img {
  display: block;
  height: 220px;
  object-fit: cover;
  width: 100%;
}

.cardBody {
  padding: 1.25rem;
}

.status {
  color: var(--color-accent);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

h3 {
  color: var(--color-text);
  font-size: 1.4rem;
  line-height: 1.1;
  margin: 0.5rem 0;
}

.clue {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.metaList {
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
  padding-top: 1rem;
}

.metaList p {
  color: var(--color-muted);
  font-size: 0.95rem;
  margin: 0;
}

.emptyState {
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.5rem;
  margin-top: 1.5rem;
  padding: 2rem 1.25rem;
  text-align: center;
}

.emptyState h3 {
  color: var(--color-text);
  font-size: 1.4rem;
  margin: 0 0 0.5rem;
}

.emptyState p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 700px) {
  .tagsGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1040px) {
  .tagsGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>