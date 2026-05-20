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

      <section class="submitCallout" aria-label="Submit your match">
        <div>
          <p class="eyebrow">Think you found it?</p>
          <h2>Submit your matching photo.</h2>
          <p>
            Prove the current location, then set the next tag for everyone else
            to find.
          </p>
        </div>

        <NuxtLink to="/submit" class="primaryButton">
          Submit your match
        </NuxtLink>
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
.submitCallout {
  align-items: start;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.submitCallout h2 {
  color: var(--color-text);
  font-size: 1.5rem;
  line-height: 1.1;
  margin: 0 0 0.5rem;
}

.submitCallout p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.submitCallout .primaryButton {
  align-items: center;
  display: inline-flex;
  justify-content: center;
  width: 100%;
}

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

@media (min-width: 760px) {
  .submitCallout {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 1.5rem;
  }

  .submitCallout .primaryButton {
    flex: 0 0 auto;
    width: auto;
  }
}
</style>