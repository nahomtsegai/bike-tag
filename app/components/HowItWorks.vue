<template>
  <section id="how-it-works" class="howItWorks">
    <p class="eyebrow">How it works</p>
    <h2>Simple rules. Big adventure.</h2>

    <div class="stepsGrid">
      <article class="stepCard">
        <span>1</span>
        <h3>Find the tag</h3>
        <p>Use the photo and clue to figure out where the current tag is.</p>
      </article>

      <article class="stepCard">
        <span>2</span>
        <h3>Ride there</h3>
        <p>Bike to the location and take a matching photo.</p>
      </article>

      <article class="stepCard">
        <span>3</span>
        <h3>Submit proof</h3>
        <p>Upload your matching photo so the tag can be verified.</p>
      </article>

      <article class="stepCard">
        <span>4</span>
        <h3>Hide the next one</h3>
        <p>Choose the next mystery spot for riders to find.</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.howItWorks {
  padding: 3rem 0 0;
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

.stepsGrid {
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
}

.stepCard {
  border: 1px solid #e5e7eb;
  border-radius: 1.5rem;
  padding: 1.5rem;
}

.stepCard span {
  align-items: center;
  background: #111827;
  border-radius: 999px;
  color: white;
  display: inline-flex;
  font-weight: 800;
  height: 2rem;
  justify-content: center;
  width: 2rem;
}

h3 {
  color: #111827;
  font-size: 1.25rem;
  margin: 1rem 0 0.5rem;
}

.stepCard p {
  color: #4b5563;
  line-height: 1.6;
  margin: 0;
}

@media (min-width: 640px) {
  .stepsGrid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 960px) {
  .stepsGrid {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>