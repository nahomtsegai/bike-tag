<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Bike Tag</p>
        <h1 class="pageTitle">Ride, find, tag, repeat.</h1>
        <p class="pageIntro">
          Jump into the current game, submit a match, browse previous tags, or
          explore found locations.
        </p>
      </section>

      <section class="dashboardGrid" aria-label="Bike Tag dashboard">
        <NuxtLink to="/current-tag" class="dashboardCard primaryCard">
          <p class="eyebrow">Play</p>
          <h2>Current tag</h2>
          <p>
            View the active tag, check the timer, and see whether the clue has
            unlocked.
          </p>
        </NuxtLink>

        <NuxtLink to="/submit" class="dashboardCard">
          <p class="eyebrow">Found it?</p>
          <h2>Submit tag</h2>
          <p>
            Upload your matching photo, confirm the map link, and hide the next
            tag.
          </p>
        </NuxtLink>

        <NuxtLink to="/tags" class="dashboardCard">
          <p class="eyebrow">History</p>
          <h2>Previous tags</h2>
          <p>
            Browse completed tags and revisit the clues, photos, and riders who
            found them.
          </p>
        </NuxtLink>

        <NuxtLink to="/map" class="dashboardCard">
          <p class="eyebrow">Locations</p>
          <h2>Map</h2>
          <p>
            Open found tag locations in Maps while active tag locations stay
            hidden.
          </p>
        </NuxtLink>
      </section>
    </div>
  </main>
</template>

<style scoped>
.dashboardGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.dashboardCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  color: inherit;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
  text-decoration: none;
}

.dashboardCard:hover {
  border-color: var(--color-primary);
}

.dashboardCard:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.primaryCard {
  background: var(--color-surface-soft);
}

.dashboardCard h2 {
  color: var(--color-text);
  font-size: 1.75rem;
  line-height: 1.1;
  margin: 0;
}

.dashboardCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.dashboardCard .eyebrow {
  color: var(--color-accent);
}

@media (min-width: 760px) {
  .dashboardGrid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboardCard {
    padding: 1.5rem;
  }
}
</style>