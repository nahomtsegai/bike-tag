<template>
  <div>
    <NuxtRouteAnnouncer />

    <a class="skipLink" href="#main-content">
      Skip to main content
    </a>

    <div id="main-content" tabindex="-1">
      <NuxtPage />
    </div>

    <AppFooter />
  </div>
</template>

<style>
.skipLink {
  background: var(--color-primary);
  border: 2px solid var(--color-page);
  border-radius: 0.75rem;
  box-shadow: 0 0.75rem 2rem rgb(15 23 42 / 20%);
  color: var(--color-primary-text);
  font-weight: 900;
  left: 0.75rem;
  padding: 0.75rem 1rem;
  position: fixed;
  text-decoration: none;
  top: 0.75rem;
  transform: translateY(-200%);
  transition: transform 120ms ease-out;
  z-index: 1000;
}

.skipLink:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 3px;
  transform: translateY(0);
}
</style>
