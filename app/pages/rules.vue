<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Rules</p>
        <h1 class="pageTitle">How Bike Tag works</h1>
        <p class="pageIntro">
          Find the current tag, ride there, take a matching bike photo, then
          choose the next mystery spot for everyone else.
        </p>
      </section>

      <section class="rulesList">
        <article class="ruleCard">
          <span>1</span>
          <div>
            <h2>Find the current tag</h2>
            <p>
              Use the photo and clue to figure out where the current bike tag is.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>2</span>
          <div>
            <h2>Ride to the spot</h2>
            <p>
              Bike to the location and take your own matching photo with your bike.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>3</span>
          <div>
            <h2>Submit your match</h2>
            <p>
              Upload your matching photo so the tag can be marked as found.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>4</span>
          <div>
            <h2>Hide the next tag</h2>
            <p>
              Pick a new bike friendly location and post the next mystery photo.
            </p>
          </div>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.rulesList {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.ruleCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto 1fr;
  padding: 1.25rem;
}

.ruleCard span {
  align-items: center;
  background: var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary-text);
  display: inline-flex;
  font-weight: 900;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

.ruleCard h2 {
  color: var(--color-text);
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

.ruleCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}
</style>