<script setup lang="ts">
defineProps<{
  elapsedLabel: string
  clueIsUnlocked: boolean
  clueUnlocksInLabel: string
  locationIsHidden: boolean
}>()
</script>

<template>
  <section class="statusPanel" aria-label="Current tag status">
    <div class="statusPanelHeader">
      <p class="eyebrow">Tag status</p>
      <h3>Current game state</h3>
    </div>

    <dl class="statusList">
      <div>
        <dt>Active for</dt>
        <dd>{{ elapsedLabel }}</dd>
      </div>

      <div>
        <dt>Clue</dt>
        <dd v-if="clueIsUnlocked">Unlocked</dd>
        <dd v-else>Locked for {{ clueUnlocksInLabel }}</dd>
      </div>

      <div>
        <dt>Location</dt>
        <dd v-if="locationIsHidden">Hidden until found</dd>
        <dd v-else>Visible</dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.statusPanel {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 1.25rem;
  display: grid;
  gap: 1rem;
  margin-top: 1.25rem;
  padding: 1rem;
}

.statusPanelHeader {
  display: grid;
  gap: 0.35rem;
}

.statusPanelHeader h3 {
  color: var(--color-text);
  font-size: 1.15rem;
  line-height: 1.1;
  margin: 0;
}

.statusList {
  display: grid;
  gap: 0.85rem;
  margin: 0;
}

.statusList div {
  display: grid;
  gap: 0.25rem;
}

dt {
  color: var(--color-text);
  font-size: 0.8rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

dd {
  color: var(--color-muted);
  line-height: 1.5;
  margin: 0;
}

@media (min-width: 760px) {
  .statusPanel {
    padding: 1.15rem;
  }
}
</style>