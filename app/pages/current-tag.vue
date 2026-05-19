<script setup lang="ts">
import { useBikeTags } from '../composables/useBikeTags'

const { currentTag } = useBikeTags()
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Current tag</p>
        <h1 class="pageTitle">Find the current Bike Tag.</h1>
        <p class="pageIntro">
          Use the photo, timer, and game status to solve the active tag.
        </p>
      </section>

      <CurrentTagCard
        v-if="currentTag"
        :tag="currentTag"
      />

      <section v-else class="notFoundState">
        <p class="eyebrow">No current tag</p>
        <h2>No active tag found.</h2>
        <p>
          Reset local data or submit a new tag to start the game again.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.notFoundState {
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.5rem;
  margin-top: 1.5rem;
  padding: 2rem 1.25rem;
}

.notFoundState h2 {
  color: var(--color-text);
  font-size: 1.75rem;
  line-height: 1.1;
  margin: 0 0 0.75rem;
}

.notFoundState p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}
</style>