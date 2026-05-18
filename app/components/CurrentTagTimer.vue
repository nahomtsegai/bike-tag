<script setup lang="ts">
import { useCurrentTagTimer } from '../composables/useCurrentTagTimer'

const props = defineProps<{
  createdAtIso: string
}>()

const { elapsedLabel } = useCurrentTagTimer(() => props.createdAtIso)
</script>

<template>
  <div class="currentTagTimer" aria-label="Current tag timer">
    <span>Active for</span>
    <strong>{{ elapsedLabel }}</strong>
  </div>
</template>

<style scoped>
.currentTagTimer {
  align-items: center;
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  display: inline-flex;
  gap: 0.45rem;
  padding: 0.65rem 0.85rem;
}

.currentTagTimer span {
  color: var(--color-subtle);
  font-size: 0.85rem;
  font-weight: 900;
}

.currentTagTimer strong {
  color: var(--color-text);
  font-size: 0.95rem;
}
</style>