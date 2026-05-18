<script setup lang="ts">
import { useTheme } from '../composables/useTheme'

const { themePreference, setThemePreference } = useTheme()
</script>

<template>
  <label class="themeToggle">
    <span>Theme</span>

    <select
      :value="themePreference"
      aria-label="Choose theme"
      @change="setThemePreference(($event.target as HTMLSelectElement).value as 'light' | 'dark' | 'system')"
    >
      <option value="system">System</option>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
    </select>
  </label>
</template>

<style scoped>
.themeToggle {
  align-items: center;
  display: flex;
  gap: 0.45rem;
}

.themeToggle span {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 900;
}

select {
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 800;
  padding: 0.55rem 0.75rem;
}

select:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

@media (max-width: 620px) {
  .themeToggle span {
    display: none;
  }
}
</style>