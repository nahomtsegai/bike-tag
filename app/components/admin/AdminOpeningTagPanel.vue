<script setup lang="ts">
const props = defineProps<Record<string, unknown>>()
</script>

<template>
  <AdminTagManagementPanel v-bind="props" />
</template>
