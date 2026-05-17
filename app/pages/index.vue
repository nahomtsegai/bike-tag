<script setup lang="ts">
import { useBikeTags } from '../composables/useBikeTags'

const { currentTag } = useBikeTags()
</script>

<template>
  <main class="page">
    <div class="pageContent">
      <AppHeader />
      <HeroSection />

      <CurrentTagCard
        v-if="currentTag"
        :tag="currentTag"
      />
    </div>
  </main>
</template>