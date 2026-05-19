<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const isMenuOpen = ref(false)

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}

const isCurrentTagActive = computed(() => {
  return route.path === '/current-tag'
})
</script>

<template>
  <header class="appHeader">
    <div class="headerTopRow">
      <NuxtLink to="/" class="logo" @click="closeMenu">
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
          to="/rules"
          class="navLink"
          active-class="activeNavLink"
          @click="closeMenu"
        >
          Rules
        </NuxtLink>

        <NuxtLink
          to="/current-tag"
          class="navLink"
          :class="{ activeNavLink: isCurrentTagActive }"
          @click="closeMenu"
        >
          Current tag
        </NuxtLink>

        <NuxtLink
          to="/tags"
          class="navLink"
          active-class="activeNavLink"
          @click="closeMenu"
        >
          Tags
        </NuxtLink>

        <NuxtLink
          to="/map"
          class="navLink"
          active-class="activeNavLink"
          @click="closeMenu"
        >
          Map
        </NuxtLink>

        <NuxtLink
          to="/settings"
          class="navLink"
          active-class="activeNavLink"
          @click="closeMenu"
        >
          Settings
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
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
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
  font-size: 1.05rem;
  font-weight: 900;
  padding: 0.75rem 0;
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
  width: 2rem;
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
    width: 100%;
  }
}
</style>