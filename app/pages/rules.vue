<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Rules</p>
        <h1 class="pageTitle">How Bike Tag works</h1>
        <p class="pageIntro">
          Find the current photo location, prove it with your bike, then hide
          the next tag for everyone else.
        </p>
      </section>

      <section class="rulesList" aria-label="Bike Tag rules">
        <article class="ruleCard">
          <span>1</span>

          <div>
            <h2>Find the current tag</h2>
            <p>
              Use the current tag photo to figure out where the bike tag is.
              The photo is the first clue.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>2</span>

          <div>
            <h2>Take a matching bike photo</h2>
            <p>
              Ride to the location and take your own photo with your bike in
              the same spot.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>3</span>

          <div>
            <h2>Submit your find</h2>
            <p>
              Add your name, the found location, and your matching photo. You
              will review everything before the tag is saved.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>4</span>

          <div>
            <h2>Hide the next tag</h2>
            <p>
              Choose the next tag title, photo, hidden clue, and hidden
              location. The next rider will see the photo first.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>5</span>

          <div>
            <h2>Clues unlock after 5 days</h2>
            <p>
              The hidden clue is saved with the new tag, but it does not appear
              right away. It unlocks automatically after the tag has been active
              for 5 days.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>6</span>

          <div>
            <h2>Locations stay hidden until found</h2>
            <p>
              The hidden location is not shown while a tag is active. Once the
              tag is found, the public found location appears in the tag history
              and can open in Maps.
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