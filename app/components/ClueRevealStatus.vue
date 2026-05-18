<script setup lang="ts">
defineProps<{
  clue: string
  isUnlocked: boolean
  unlocksInLabel: string
  status: 'active' | 'found'
}>()
</script>

<template>
  <section class="clueStatus" aria-label="Clue status">
    <p v-if="status === 'found' || isUnlocked" class="statusLabel unlocked">
      Clue unlocked
    </p>

    <p v-else class="statusLabel locked">
      Clue locked
    </p>

    <p v-if="status === 'found' || isUnlocked" class="clueText">
      {{ clue }}
    </p>

    <p v-else class="lockedText">
      The written clue unlocks in {{ unlocksInLabel }}.
    </p>
  </section>
</template>

<style scoped>
.clueStatus {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  display: grid;
  gap: 0.45rem;
  padding: 1rem;
}

.statusLabel {
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.locked {
  color: var(--color-warning-text);
}

.unlocked {
  color: var(--color-accent);
}

.clueText,
.lockedText {
  line-height: 1.6;
  margin: 0;
}

.clueText {
  color: var(--color-muted);
}

.lockedText {
  color: var(--color-subtle);
  font-style: italic;
}
</style>