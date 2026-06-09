<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Admin</p>
      <h1>Bike Tag Admin</h1>
      <p class="hero-copy">
        Review submissions, watch submit errors, and manage the game.
      </p>
    </section>

    <AdminAuthGate>
      <section class="admin-grid">
        <NuxtLink
          to="/admin/submissions"
          class="admin-card admin-link-card"
        >
          <p class="eyebrow">Review</p>
          <h2>Submissions</h2>
          <p>
            Review pending, approved, rejected, and archived Bike Tag submissions.
          </p>
        </NuxtLink>

        <NuxtLink
          to="/admin/errors"
          class="admin-card admin-link-card"
        >
          <p class="eyebrow">Diagnostics</p>
          <h2>Errors</h2>
          <p>
            View submit failures, payload errors, compression events, and API breadcrumbs.
          </p>
        </NuxtLink>
      </section>
    </AdminAuthGate>
  </main>
</template>

<style scoped>
.admin-page {
  display: grid;
  gap: 1.5rem;
  margin: 0 auto;
  max-width: 76rem;
  padding: 2rem;
}

.admin-hero {
  background:
    radial-gradient(circle at top left, rgba(20, 184, 166, 0.16), transparent 26rem),
    linear-gradient(135deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.9));
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 2rem;
  padding: 2rem;
}

.admin-hero h1 {
  color: #0f172a;
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 0.95;
  margin: 0;
}

.hero-copy {
  color: #475569;
  font-size: 1.125rem;
  margin: 1rem 0 0;
  max-width: 42rem;
}

.eyebrow {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.admin-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.admin-link-card {
  color: inherit;
  display: grid;
  gap: 0.65rem;
  text-decoration: none;
}

.admin-link-card:hover {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.12);
}

.admin-link-card h2 {
  color: #0f172a;
  font-size: 1.5rem;
  margin: 0;
}

.admin-link-card p {
  color: #475569;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 860px) {
  .admin-page {
    gap: 1rem;
    padding: 1rem;
  }

  .admin-hero {
    border-radius: 1.5rem;
    padding: 1.25rem;
  }

  .admin-hero h1 {
    font-size: clamp(2.25rem, 12vw, 3.5rem);
  }

  .hero-copy {
    font-size: 1rem;
  }

  .admin-grid {
    grid-template-columns: 1fr;
  }

  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }
}

@media (max-width: 520px) {
  .admin-page {
    padding: 0.75rem;
  }
}
</style>