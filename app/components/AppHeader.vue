<template>
  <header class="appHeader">
    <NuxtLink to="/" class="logo">Bike Tag</NuxtLink>

    <nav class="navActions" aria-label="Primary navigation">
      <NuxtLink to="/rules" class="secondaryLink">Rules</NuxtLink>
      <NuxtLink to="/tags" class="secondaryLink">Tags</NuxtLink>
      <NuxtLink to="/#current-tag" class="headerAction">Current tag</NuxtLink>
      <ThemeToggle />
    </nav>
  </header>
</template>

<style scoped>
.appHeader {
  display: grid;
  gap: 1rem;
  padding: 1rem 0;
}

.logo {
  color: var(--color-text);
  font-size: 1.6rem;
  font-weight: 900;
  line-height: 1;
  text-decoration: none;
}

.navActions {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
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
  font-size: 0.95rem;
  font-weight: 900;
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

  .logo {
    font-size: 1.75rem;
  }

  .navActions {
    justify-content: flex-end;
  }
}
</style>