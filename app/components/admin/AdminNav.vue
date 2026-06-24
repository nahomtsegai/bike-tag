<script setup lang="ts">
const liveSiteLinks = [
  {
    label: 'Home',
    href: 'https://www.louisvillebiketag.com'
  },
  {
    label: 'Current Tag',
    href: 'https://www.louisvillebiketag.com/current-tag'
  },
  {
    label: 'Completed Tags',
    href: 'https://www.louisvillebiketag.com/tags'
  },
  {
    label: 'Map',
    href: 'https://www.louisvillebiketag.com/map'
  },
  {
    label: 'Rules',
    href: 'https://www.louisvillebiketag.com/rules'
  },
  {
    label: 'Submission Status',
    href: 'https://www.louisvillebiketag.com/submission-status'
  }
] as const
</script>

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
      to="/admin/settings"
      class="adminNavLink"
    >
      Settings
    </NuxtLink>

    <NuxtLink
      to="/admin/storage-cleanup"
      class="adminNavLink"
    >
      Storage
    </NuxtLink>

    <details class="liveSiteMenu">
      <summary class="liveSiteSummary">
        View Live Site
        <span aria-hidden="true">↗</span>
      </summary>

      <div class="liveSiteLinks">
        <a
          v-for="link in liveSiteLinks"
          :key="link.href"
          :href="link.href"
          class="liveSiteLink"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${link.label} (opens in a new tab)`"
        >
          <span>{{ link.label }}</span>
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </details>
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
  position: relative;
}

.adminNavLink,
.liveSiteSummary {
  border-radius: 999px;
  color: #334155;
  font-weight: 900;
  padding: 0.7rem 1rem;
  text-decoration: none;
}

.adminNavLink:hover,
.liveSiteSummary:hover {
  background: #f1f5f9;
  color: #0f172a;
}

.adminNavLink.router-link-active {
  background: #0f172a;
  color: #fff;
}

.liveSiteMenu {
  margin-left: auto;
  position: relative;
}

.liveSiteSummary {
  align-items: center;
  cursor: pointer;
  display: flex;
  gap: 0.45rem;
  list-style: none;
  user-select: none;
}

.liveSiteSummary::-webkit-details-marker {
  display: none;
}

.liveSiteSummary:focus-visible,
.liveSiteLink:focus-visible {
  outline: 3px solid #38bdf8;
  outline-offset: 2px;
}

.liveSiteMenu[open] .liveSiteSummary {
  background: #ecfdf5;
  color: #065f46;
}

.liveSiteLinks {
  background: #fff;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 1rem;
  box-shadow: 0 1rem 2.5rem rgba(15, 23, 42, 0.16);
  display: grid;
  gap: 0.15rem;
  min-width: 13rem;
  padding: 0.35rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.5rem);
  z-index: 20;
}

.liveSiteLink {
  align-items: center;
  border-radius: 0.75rem;
  color: #334155;
  display: flex;
  font-weight: 800;
  gap: 1rem;
  justify-content: space-between;
  padding: 0.75rem 0.85rem;
  text-decoration: none;
}

.liveSiteLink:hover {
  background: #f1f5f9;
  color: #0f172a;
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

  .liveSiteMenu {
    margin-left: 0;
  }

  .liveSiteSummary {
    justify-content: center;
  }

  .liveSiteLinks {
    box-shadow: none;
    margin-top: 0.35rem;
    min-width: 0;
    position: static;
  }
}
</style>
