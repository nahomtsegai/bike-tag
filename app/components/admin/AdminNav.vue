<template>
  <nav class="adminNav" aria-label="Admin navigation">
    <NuxtLink
      to="/admin"
      class="adminNavLink"
    >
      Overview
    </NuxtLink>

    <NuxtLink
      to="/admin/submissions"
      class="adminNavLink"
    >
      Submissions
    </NuxtLink>

    <NuxtLink
      to="/admin/activity"
      class="adminNavLink"
    >
      Activity
    </NuxtLink>

    <NuxtLink
      to="/admin/errors"
      class="adminNavLink"
    >
      Errors
    </NuxtLink>

    <NuxtLink
      to="/admin/notifications"
      class="adminNavLink"
    >
      Notifications
    </NuxtLink>

    <NuxtLink
      to="/admin/storage-cleanup"
      class="adminNavLink"
    >
      Storage
    </NuxtLink>
  </nav>
</template>

<style scoped>
.adminNav {
  align-items: center;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 999px;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.06);
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.35rem;
}

.adminNavLink {
  border-radius: 999px;
  color: #334155;
  font-weight: 900;
  padding: 0.7rem 1rem;
  text-decoration: none;
}

.adminNavLink:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.adminNavLink.router-link-active {
  background: #0f172a;
  color: #fff;
}

@media (max-width: 560px) {
  .adminNav {
    align-items: stretch;
    border-radius: 1.25rem;
    display: grid;
  }

  .adminNavLink {
    text-align: center;
  }
}
</style>
