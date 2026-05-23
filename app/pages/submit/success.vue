<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />

      <section class="confirmationHero">
        <p class="eyebrow">Submission received</p>
        <h1 class="pageTitle">Your tag is in the review queue.</h1>
        <p class="pageIntro">
          Thanks for submitting a tag. An admin will review it before it becomes
          the current tag.
        </p>
      </section>

      <section class="confirmationCard" aria-label="Submission confirmation">
        <div class="confirmationIcon" aria-hidden="true">
          ✓
        </div>

        <div class="confirmationContent">
          <h2>Not live yet</h2>
          <p>
            The current tag stays active until an admin approves your submission.
            Your next tag photo, clue, and hidden map location will not become
            part of the live game unless the submission is approved.
          </p>
        </div>
      </section>

      <section class="nextSteps" aria-label="What happens next">
        <h2>What happens next?</h2>

        <ol>
          <li>An admin reviews your match photo and found location.</li>
          <li>The admin checks the proposed next tag details.</li>
          <li>If approved, your submission becomes the next active tag.</li>
          <li>If rejected, the current tag stays unchanged.</li>
        </ol>
      </section>

      <nav class="confirmationActions" aria-label="Submission next actions">
        <NuxtLink to="/current-tag" class="primaryButton">
          View current tag
        </NuxtLink>

        <NuxtLink to="/rules" class="secondaryButton">
          Read rules
        </NuxtLink>

        <NuxtLink to="/submit" class="secondaryButton">
          Submit another tag
        </NuxtLink>
      </nav>
    </div>
  </main>
</template>

<style scoped>
.confirmationHero {
  display: grid;
  gap: 0.75rem;
  padding-top: 1.5rem;
}

.confirmationCard {
  align-items: start;
  background: var(--color-success-surface);
  border: 1px solid var(--color-success-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.confirmationIcon {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-success-border);
  border-radius: 999px;
  color: var(--color-text);
  display: inline-flex;
  font-size: 1.4rem;
  font-weight: 900;
  height: 3rem;
  justify-content: center;
  width: 3rem;
}

.confirmationContent {
  display: grid;
  gap: 0.5rem;
}

.confirmationContent h2,
.nextSteps h2 {
  color: var(--color-text);
  font-size: 1.35rem;
  line-height: 1.15;
  margin: 0;
}

.confirmationContent p {
  color: var(--color-muted);
  line-height: 1.6;
  margin: 0;
}

.nextSteps {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  display: grid;
  gap: 1rem;
  margin-top: 1rem;
  padding: 1.25rem;
}

.nextSteps ol {
  color: var(--color-muted);
  display: grid;
  gap: 0.65rem;
  line-height: 1.6;
  margin: 0;
  padding-left: 1.25rem;
}

.confirmationActions {
  display: grid;
  gap: 0.75rem;
  margin-top: 1rem;
}

@media (min-width: 700px) {
  .confirmationCard {
    grid-template-columns: auto 1fr;
    padding: 1.5rem;
  }

  .nextSteps {
    padding: 1.5rem;
  }

  .confirmationActions {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
  }
}
</style>