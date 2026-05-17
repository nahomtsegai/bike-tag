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

    <div class="tagsGrid">
      <article v-for="tag in tags" :key="tag.id" class="tagPreviewCard">
        <div class="imagePlaceholder">
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
      </article>
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

.eyebrow {
  color: #047857;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
}

h2 {
  color: #111827;
  font-size: clamp(2rem, 8vw, 3.5rem);
  line-height: 1.05;
  margin: 0;
}

.sectionHeader p {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.65;
}

.tagsGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.tagPreviewCard {
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  overflow: hidden;
}

.imagePlaceholder {
  align-items: center;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  font-weight: 800;
  justify-content: center;
  min-height: 180px;
}

.cardBody {
  padding: 1.25rem;
}

.status {
  color: #047857;
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

h3 {
  color: #111827;
  font-size: 1.4rem;
  line-height: 1.1;
  margin: 0.5rem 0;
}

.clue {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

.metaList {
  border-top: 1px solid #e5e7eb;
  display: grid;
  gap: 0.25rem;
  margin-top: 1rem;
  padding-top: 1rem;
}

.metaList p {
  color: #4b5563;
  font-size: 0.95rem;
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