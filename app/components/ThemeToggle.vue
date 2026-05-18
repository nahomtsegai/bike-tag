<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { themePreference, setThemePreference } = useTheme()

const themeOptions = [
  {
    label: 'Light',
    value: 'light'
  },
  {
    label: 'Dark',
    value: 'dark'
  },
  {
    label: 'System',
    value: 'system'
  }
] as const
</script>

<template>
  <section class="themeToggle" aria-label="Theme setting">
    <p>Theme</p>

    <div class="themeOptions">
      <button
        v-for="themeOption in themeOptions"
        :key="themeOption.value"
        type="button"
        :class="{ activeTheme: themePreference === themeOption.value }"
        @click="setThemePreference(themeOption.value)"
      >
        {{ themeOption.label }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.themeToggle {
  display: grid;
  gap: 0.55rem;
}

.themeToggle p {
  color: var(--color-muted);
  font-size: 1.05rem;
  font-weight: 900;
  margin: 0;
}

.themeOptions {
  background: var(--color-surface-soft);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  display: grid;
  gap: 0.25rem;
  grid-template-columns: repeat(3, 1fr);
  padding: 0.25rem;
}

button {
  background: transparent;
  border: 0;
  border-radius: 999px;
  color: var(--color-muted);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 900;
  padding: 0.6rem 0.75rem;
}

button:hover {
  color: var(--color-text);
}

button:focus {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.activeTheme {
  background: var(--color-primary);
  color: var(--color-primary-text);
}

.activeTheme:hover {
  color: var(--color-primary-text);
}

@media (min-width: 760px) {
  .themeToggle {
    align-items: center;
    display: flex;
    gap: 0.5rem;
  }

  .themeOptions {
    min-width: 220px;
  }
}
</style>