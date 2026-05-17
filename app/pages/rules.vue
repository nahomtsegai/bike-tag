<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="rulesHero">
        <p class="eyebrow">Rules</p>
        <h1>How Bike Tag works</h1>
        <p>
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
.page {
  min-height: 100vh;
  background: #ffffff;
  color: #111827;
}

.pageContent {
  margin: 0 auto;
  max-width: 1120px;
  padding: 0 1rem 2rem;
}

@media (min-width: 760px) {
  .pageContent {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
    padding-bottom: 3rem;
  }
}

.rulesHero {
  background: linear-gradient(135deg, #f0fdf4, #eff6ff);
  border: 1px solid #dbeafe;
  border-radius: 1.5rem;
  padding: 2rem 1.25rem;
}

.eyebrow {
  color: #047857;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  margin: 0 0 0.75rem;
  text-transform: uppercase;
}

h1 {
  color: #111827;
  font-size: clamp(2.25rem, 11vw, 4.5rem);
  line-height: 0.95;
  margin: 0;
}

.rulesHero p {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.65;
  margin: 1rem 0 0;
}

.rulesList {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.ruleCard {
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: auto 1fr;
  padding: 1.25rem;
}

.ruleCard span {
  align-items: center;
  background: #111827;
  border-radius: 999px;
  color: white;
  display: inline-flex;
  font-weight: 900;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

h2 {
  color: #111827;
  font-size: 1.25rem;
  margin: 0 0 0.5rem;
}

.ruleCard p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 760px) {
  .pageContent {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  .rulesHero {
    border-radius: 2rem;
    padding: 4rem 2rem;
  }
}
</style>