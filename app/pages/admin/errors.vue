<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Admin Errors</p>
      <h1>Submit Errors</h1>
      <p class="hero-copy">
        Review submit diagnostics, payload failures, and API breadcrumbs.
      </p>
    </section>

    <AdminAuthGate>
      <section class="admin-card">
        <div class="section-header">
          <div>
            <p class="eyebrow">Coming soon</p>
            <h2>Diagnostics dashboard</h2>
          </div>
        </div>

        <p class="helper-text">
          This page will show recent submit failures, 413 payload errors, photo
          compression events, and API-side submit breadcrumbs.
        </p>
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

.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.section-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h2 {
  color: #0f172a;
  font-size: 1.5rem;
  margin: 0.25rem 0 0;
}

.eyebrow {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.helper-text {
  color: #64748b;
  margin: 1rem 0 0;
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