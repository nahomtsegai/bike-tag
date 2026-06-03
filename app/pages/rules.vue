<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="pageHero">
        <p class="eyebrow">Rules</p>
        <h1 class="pageTitle">How Bike Tag works</h1>
        <p class="pageIntro">
          Find the current mystery photo, ride there with your bike, submit your
          match, then choose the next spot for everyone else to chase.
        </p>
      </section>

      <section class="quickStart" aria-labelledby="quickStartTitle">
        <div>
          <p class="eyebrow">Quick start</p>
          <h2 id="quickStartTitle">The whole game in three moves.</h2>
        </div>

        <div class="quickStartGrid">
          <article class="quickStartCard">
            <span>1</span>
            <h3>Find it</h3>
            <p>
              Use the current tag photo to figure out the mystery location.
            </p>
          </article>

          <article class="quickStartCard">
            <span>2</span>
            <h3>Match it</h3>
            <p>
              Ride there and take your own bike photo at the same spot.
            </p>
          </article>

          <article class="quickStartCard">
            <span>3</span>
            <h3>Move it</h3>
            <p>
              Submit your find and create the next mystery spot.
            </p>
          </article>
        </div>
      </section>

      <section class="rulesActions" aria-label="Rules page actions">
        <div class="rulesActionCard">
          <h2>Ready to play?</h2>
          <p>
            Start with the current tag photo and ride when you think you know
            the location.
          </p>

          <NuxtLink to="/current-tag" class="primaryButton">
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
              the same spot. Make sure the photo clearly shows that you found
              the right place.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>3</span>

          <div>
            <h2>Submit your find</h2>
            <p>
              Add your rider name, the found location, and your matching photo.
              You will review everything before sending it to admins.
            </p>
          </div>
        </article>

        <article class="ruleCard">
          <span>4</span>

          <div>
            <h2>Create the next mystery spot</h2>
            <p>
              Choose the next tag title, photo, hidden clue, and hidden
              location. Riders see the photo first. The clue unlocks later, and
              the exact location stays private while the tag is active.
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

      <section class="fairPlayGrid" aria-label="Safety and fair play">
        <article class="rulesReminder">
          <h2>Keep it safe</h2>
          <p>
            Choose public, bike friendly places. Avoid private property, unsafe
            roads, restricted areas, or places riders cannot reasonably access.
          </p>
        </article>

        <article class="rulesReminder">
          <h2>Keep it findable</h2>
          <p>
            Pick a photo that gives riders enough visual clues to hunt without
            revealing the exact answer too quickly.
          </p>
        </article>

        <article class="rulesReminder">
          <h2>Keep it fair</h2>
          <p>
            Do not move, damage, block, or hide anything in the real world.
            Bike Tag should be a photo hunt, not a scavenger hunt.
          </p>
        </article>
      </section>
    </div>
  </main>
</template>

<style scoped>
.quickStart {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.quickStart h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.15;
  margin: 0.25rem 0 0;
}

.quickStartGrid {
  display: grid;
  gap: 1rem;
}

.quickStartCard {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1rem;
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
}

.quickStartCard span {
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

.quickStartCard h3 {
  color: var(--color-text);
  font-size: 1.15rem;
  line-height: 1.15;
  margin: 0;
}

.quickStartCard p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

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

.rulesActionCard .primaryButton,
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

.fairPlayGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
}

.rulesReminder {
  background: var(--color-surface-soft);
}

@media (min-width: 760px) {
  .quickStart,
  .rulesActionCard,
  .ruleCard,
  .rulesReminder {
    padding: 1.5rem;
  }

  .quickStartGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .rulesActions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .fairPlayGrid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>