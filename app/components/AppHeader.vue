<script setup lang="ts">
import { ref } from 'vue'

const isMenuOpen = ref(false)

const closeMenu = () => {
  isMenuOpen.value = false
}

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
}
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
        @click="toggleMenu"
      >
        {{ isMenuOpen ? 'Close' : 'Menu' }}
      </button>
    </div>

    <nav
      id="primaryNavigation"
      class="navActions"
      :class="{ navActionsOpen: isMenuOpen }"
      aria-label="Primary navigation"
    >
      <NuxtLink to="/rules" class="secondaryLink" @click="closeMenu">
        Rules
      </NuxtLink>

      <NuxtLink to="/tags" class="secondaryLink" @click="closeMenu">
        Tags
      </NuxtLink>

      <NuxtLink to="/#current-tag" class="headerAction" @click="closeMenu">
        Current tag
      </NuxtLink>

      <ThemeToggle />
    </nav>
  </header>
</template>

<style scoped>
.appHeader {
  display: grid;
  gap: 0.85rem;
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
  padding: 0.7rem 1rem;
}

.menuButton:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

.navActions {
  display: none;
}

.navActionsOpen {
  align-items: stretch;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  display: grid;
  gap: 0.65rem;
  padding: 1rem;
}

.secondaryLink {
  color: var(--color-muted);
  font-size: 1rem;
  font-weight: 900;
  text-decoration: none;
}

.secondaryLink:hover {
  color: var(--color-text);
}

.headerAction {
  background: var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary-text);
  display: inline-flex;
  font-size: 0.95rem;
  font-weight: 900;
  justify-content: center;
  padding: 0.75rem 1rem;
  text-decoration: none;
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
    background: transparent;
    border: 0;
    border-radius: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    justify-content: flex-end;
    padding: 0;
  }
}
</style>