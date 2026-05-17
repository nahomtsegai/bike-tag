<template>
  <header class="appHeader">
    <NuxtLink to="/" class="logo">Bike Tag</NuxtLink>

    <a href="#current-tag" class="headerAction">Current tag</a>
  </header>
</template>

<style scoped>
.appHeader {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
}

.logo {
  color: #111827;
  font-size: 1.25rem;
  font-weight: 900;
  text-decoration: none;
}

.headerAction {
  background: #111827;
  border-radius: 999px;
  color: white;
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.7rem 1rem;
  text-decoration: none;
}

@media (min-width: 760px) {
  .appHeader {
    padding: 1.25rem 0;
  }

  .logo {
    font-size: 1.35rem;
  }
}
</style>