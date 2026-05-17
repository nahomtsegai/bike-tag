<script setup lang="ts">
import type { BikeTag } from '../data/mockTags'

defineProps<{
  tag: BikeTag
}>()
</script>

<template>
  <section id="current-tag" class="currentTag">
    <div class="sectionHeader">
      <p class="eyebrow">Current tag</p>
      <h2>{{ tag.title }}</h2>
      <p>{{ tag.clue }}</p>
    </div>

    <article class="tagCard">
      <div class="imagePlaceholder">
        <span>Bike photo coming soon</span>
      </div>

      <div class="tagDetails">
        <p class="status">{{ tag.status }}</p>
        <h3>{{ tag.locationName }}</h3>

        <div class="metaList">
          <p>Posted by {{ tag.foundBy }}</p>
          <p>Posted on {{ tag.createdAt }}</p>
        </div>

        <NuxtLink to="/submit" class="primaryButton matchButton">Submit your match</NuxtLink>
      </div>
    </article>
  </section>
</template>

<style scoped>
.currentTag {
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

.tagCard {
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  margin-top: 1.25rem;
  overflow: hidden;
}

.imagePlaceholder {
  align-items: center;
  background: #f3f4f6;
  color: #6b7280;
  display: flex;
  font-weight: 800;
  justify-content: center;
  min-height: 260px;
}

.tagDetails {
  padding: 1.5rem;
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
  font-size: 1.75rem;
  line-height: 1.1;
  margin: 0.5rem 0 1rem;
}

.metaList {
  display: grid;
  gap: 0.25rem;
}

.metaList p {
  color: #4b5563;
  margin: 0;
}

.matchButton {
  display: inline-flex;
  align-items: center;
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

  .imagePlaceholder {
    min-height: 340px;
  }

  .tagDetails {
    padding: 2rem;
  }
}
</style>