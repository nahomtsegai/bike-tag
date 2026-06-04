<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

type NavigationItem = {
  label: string
  path: string
  exact?: boolean
}

const route = useRoute()
const isMenuOpen = ref(false)

const navigationItems: NavigationItem[] = [
  {
    label: 'Current Tag',
    path: '/current-tag',
    exact: true
  },
  {
    label: 'Tags',
    path: '/tags'
  },
  {
    label: 'Map',
    path: '/map',
    exact: true
  },
  {
    label: 'Rules',
    path: '/rules',
    exact: true
  },
  {
    label: 'Submission Status',
    path: '/submission-status'
  },
  {
    label: 'Settings',
    path: '/settings',
    exact: true
  }
]

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const normalizedPath = computed(() => {
  if (route.path.length > 1 && route.path.endsWith('/')) {
    return route.path.slice(0, -1)
  }

  return route.path
})

const isNavigationItemActive = (item: NavigationItem) => {
  if (item.exact) {
    return normalizedPath.value === item.path
  }

  return (
    normalizedPath.value === item.path ||
    normalizedPath.value.startsWith(`${item.path}/`)
  )
}
</script>

<template>
  <header class="appHeader">
    <div class="headerTopRow">
      <NuxtLink
        to="/"
        class="logo"
        :aria-current="normalizedPath === '/' ? 'page' : undefined"
        @click="closeMenu"
      >
        Bike Tag
      </NuxtLink>

      <button
        class="menuButton"
        type="button"
        :aria-expanded="isMenuOpen"
        aria-controls="primaryNavigation"
        aria-label="Toggle navigation menu"
        @click="toggleMenu"
      >
        <span v-if="isMenuOpen">Close</span>
        <span v-else>Menu</span>
      </button>
    </div>

    <nav
      id="primaryNavigation"
      class="navActions"
      :class="{ navActionsOpen: isMenuOpen }"
      aria-label="Primary navigation"
    >
      <div class="navLinks">
        <NuxtLink
          v-for="navigationItem in navigationItems"
          :key="navigationItem.path"
          :to="navigationItem.path"
          class="navLink"
          :class="{
            activeNavLink: isNavigationItemActive(navigationItem)
          }"
          :aria-current="
            isNavigationItemActive(navigationItem) ? 'page' : undefined
          "
          @click="closeMenu"
        >
          {{ navigationItem.label }}
        </NuxtLink>
      </div>
    </nav>
  </header>
</template>

<style scoped>
.appHeader {
  display: grid;
  gap: 0.75rem;
  padding: 1rem 0;
}

.headerTopRow {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.logo {
  border-radius: 0.85rem;
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
}

.logo:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
}

.menuButton {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 900;
  padding: 0.65rem 1rem;
}

.menuButton:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

.navActions {
  display: none;
}

.navActionsOpen {
  display: grid;
  gap: 1rem;
  padding: 0.75rem 0 0.25rem;
}

.navLinks {
  display: grid;
  gap: 0.15rem;
}

.navLink {
  border-radius: 0.85rem;
  color: var(--color-muted);
  display: inline-block;
  font-size: 1.05rem;
  font-weight: 900;
  justify-self: start;
  padding: 0.75rem 0;
  position: relative;
  text-decoration: none;
}

.navLink:hover {
  color: var(--color-text);
}

.navLink:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.activeNavLink {
  color: var(--color-text);
}

.activeNavLink::after {
  background: var(--color-primary);
  border-radius: 999px;
  content: '';
  display: block;
  height: 0.2rem;
  margin-top: 0.35rem;
  width: 100%;
}

@media (min-width: 760px) {
  .appHeader {
    align-items: center;
    display: flex;
    gap: 1rem;
    justify-content: space-between;
    padding: 1.25rem 0;
  }

  .headerTopRow {
    display: contents;
  }

  .logo {
    font-size: 1.75rem;
  }

  .menuButton {
    display: none;
  }

  .navActions,
  .navActionsOpen {
    align-items: center;
    display: flex;
    gap: 0.9rem;
    justify-content: flex-end;
    padding: 0;
  }

  .navLinks {
    align-items: center;
    display: flex;
    gap: 0.9rem;
  }

  .navLink {
    font-size: 0.95rem;
    padding: 0;
  }

  .activeNavLink::after {
    margin-top: 0.25rem;
  }
}
</style>