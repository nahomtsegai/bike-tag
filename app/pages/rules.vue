<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Rules</p>
        <h1 class="pageTitle">How Bike Tag works</h1>
        <p class="pageIntro">
          Find the current photo location, prove it with your bike, then choose
          the next mystery spot for everyone else.
        </p>
      </section>

      <section class="rulesActions" aria-label="Rules page actions">
        <div class="rulesActionCard">
          <h2>Ready to play?</h2>
          <p>
            Start with the current tag photo and ride when you think you know
            the location.
          </p>

          <NuxtLink to="/current-tag" class="secondaryButton">
            View current tag
          </NuxtLink>
        </div>

        <div class="rulesActionCard">
          <h2>Already found it?</h2>
          <p>
            Submit your matching photo and proposed next tag for admin review.
          </p>

          <NuxtLink to="/submit" class="secondaryButton">
            Submit your match
          </NuxtLink>
        </div>
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
              the same spot. The photo should make it clear that you found the
              right place.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>3</span>

          <div>
            <h2>Submit your find</h2>
            <p>
              Add your name, the found location, and your matching photo. You
              will review everything before sending it to admins.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>4</span>

          <div>
            <h2>Hide the next tag</h2>
            <p>
              Choose the next tag title, photo, hidden clue, and hidden
              location. The next rider sees the photo first, while the clue and
              exact location stay private.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>5</span>

          <div>
            <h2>Wait for admin review</h2>
            <p>
              An admin reviews your match photo, found location, and next tag
              details. The current tag does not change until your submission is
              approved.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>6</span>

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
          <span>7</span>

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

      <section class="rulesReminder" aria-label="Fair play reminder">
        <h2>Keep it fun and findable</h2>
        <p>
          Pick public, bike friendly spots when setting a new tag. Avoid private
          property, unsafe locations, or places riders cannot reasonably access.
        </p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.rulesActions {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.rulesActionCard,
.rulesReminder {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 0.75rem;
  padding: 1.25rem;
}

.rulesActionCard h2,
.rulesReminder h2 {
  color: var(--color-text);
  font-size: 1.2rem;
  line-height: 1.15;
  margin: 0;
}

.rulesActionCard p,
.rulesReminder p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.rulesActionCard .secondaryButton {
  justify-self: start;
}

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

.rulesReminder {
  background: var(--color-surface-soft);
  margin-top: 1rem;
}

@media (min-width: 760px) {
  .rulesActions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .rulesActionCard,
  .ruleCard,
  .rulesReminder {
    padding: 1.5rem;
  }
}
</style>