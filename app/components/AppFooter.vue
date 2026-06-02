<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const shouldShowFooter = computed(() => {
  return !route.path.startsWith('/admin')
})

const footerLinks = [
  {
    label: 'Current Tag',
    to: '/current-tag'
  },
  {
    label: 'Tags',
    to: '/tags'
  },
  {
    label: 'Map',
    to: '/map'
  },
  {
    label: 'Rules',
    to: '/rules'
  },
  {
    label: 'Submit',
    to: '/submit'
  },
  {
    label: 'Submission Status',
    to: '/submission-status'
  },
  {
    label: 'Settings',
    to: '/settings'
  }
]
</script>

<template>
  <footer
    v-if="shouldShowFooter"
    class="appFooter"
  >
    <div class="footerContent">
      <p class="footerTitle">Bike Tag Louisville</p>

      <nav
        class="footerNav"
        aria-label="Footer navigation"
      >
        <NuxtLink
          v-for="link in footerLinks"
          :key="link.to"
          :to="link.to"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.appFooter {
  margin: 3rem auto 0;
  max-width: 76rem;
  padding: 0 1rem 2rem;
}

.footerContent {
  align-items: center;
  border-top: 1px solid var(--color-border);
  display: grid;
  gap: 1rem;
  padding-top: 1.25rem;
}

.footerTitle {
  color: var(--color-text);
  font-size: 0.95rem;
  font-weight: 900;
  margin: 0;
}

.footerNav {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem 1rem;
}

.footerNav a {
  color: var(--color-muted);
  font-size: 0.9rem;
  font-weight: 800;
  text-decoration: none;
}

.footerNav a:hover {
  color: var(--color-primary);
  text-decoration: underline;
}

.footerNav a:focus {
  border-radius: 0.5rem;
  outline: 3px solid var(--color-focus);
  outline-offset: 0.25rem;
}

@media (min-width: 760px) {
  .appFooter {
    margin-top: 4rem;
    padding: 0 2rem 2rem;
  }

  .footerContent {
    display: flex;
    justify-content: space-between;
  }

  .footerNav {
    justify-content: flex-end;
  }
}
</style>