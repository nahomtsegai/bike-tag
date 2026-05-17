<template>
  <section class="hero">
    <p class="eyebrow">Ride. Find. Tag.</p>

    <h1>Find the tag. Hide the next one.</h1>

    <p class="heroCopy">
      A local photo tag game for cyclists. Follow the clue, ride to the spot,
      take your matching bike photo, then choose the next tag.
    </p>

    <div class="heroActions">
      <a href="#current-tag" class="primaryButton">View current tag</a>
      <button class="secondaryButton" type="button">Submit a tag</button>
    </div>
  </section>
</template>

<style scoped>
.hero {
  background: linear-gradient(135deg, #f0fdf4, #eff6ff);
  border: 1px solid #dbeafe;
  border-radius: 1.5rem;
  padding: 2rem 1.25rem;
  text-align: left;
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
  max-width: 820px;
}

.heroCopy {
  color: #4b5563;
  font-size: 1rem;
  line-height: 1.65;
  margin: 1rem 0 0;
  max-width: 680px;
}

.heroActions {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.primaryButton,
.secondaryButton {
  border-radius: 999px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 800;
  padding: 0.95rem 1.25rem;
  text-align: center;
}

.primaryButton {
  background: #111827;
  color: white;
  text-decoration: none;
}

.secondaryButton {
  background: white;
  border: 1px solid #d1d5db;
  color: #111827;
}

@media (min-width: 640px) {
  .hero {
    border-radius: 2rem;
    padding: 4rem 2rem;
    text-align: center;
  }

  .heroCopy {
    font-size: 1.2rem;
    margin-left: auto;
    margin-right: auto;
  }

  .heroActions {
    display: flex;
    justify-content: center;
  }
}
</style>