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
