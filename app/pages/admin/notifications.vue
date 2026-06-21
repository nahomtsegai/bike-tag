<template>
  <main class="admin-page">
    <section class="admin-hero">
      <p class="eyebrow">Notifications</p>
      <h1>Delivery History</h1>
      <p class="hero-copy">
        Review submission email attempts and retry the latest failed delivery.
      </p>
    </section>

    <AdminAuthGate>
      <AdminNotificationDeliveryPanel />
    </AdminAuthGate>
  </main>
</template>

<style scoped>
.admin-page{display:grid;gap:1.5rem;margin:0 auto;max-width:76rem;padding:2rem}.admin-hero{background:linear-gradient(135deg,rgba(248,250,252,.98),rgba(236,254,255,.9));border:1px solid rgba(148,163,184,.28);border-radius:2rem;padding:2rem}.admin-hero h1{color:#0f172a;font-size:clamp(2.5rem,8vw,5rem);line-height:.95;margin:0}.hero-copy{color:#475569;font-size:1.125rem;margin:1rem 0 0;max-width:48rem}.eyebrow{color:#0e7490;font-size:.8rem;font-weight:800;letter-spacing:.14em;margin:0;text-transform:uppercase}@media(max-width:860px){.admin-page{gap:1rem;padding:1rem}.admin-hero{border-radius:1.5rem;padding:1.25rem}.admin-hero h1{font-size:clamp(2.25rem,12vw,3.5rem)}.hero-copy{font-size:1rem}}
</style>
