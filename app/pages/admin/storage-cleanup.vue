<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Storage Operations</p>
      <h1>Cleanup Trends</h1>
      <p class="hero-copy">
        Review observation-only storage scans, candidate growth, estimated bytes,
        and scan failures. No files are deleted from this page.
      </p>
    </section>

    <AdminAuthGate>
      <AdminStorageCleanupPanel />
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
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.18), transparent 26rem),
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
  max-width: 48rem;
}

.eyebrow {
  color: #b45309;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
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
}
</style>
