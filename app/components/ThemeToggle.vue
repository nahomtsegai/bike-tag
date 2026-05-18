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
}

.themeToggle span {
  color: var(--color-muted);
  font-size: 0.85rem;
  font-weight: 900;
  margin-right: 0.45rem;
}

select {
  appearance: none;
  background: var(--color-surface);
  border: 1px solid var(--color-border-strong);
  border-radius: 999px;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 900;
  min-height: 2.75rem;
  padding: 0.65rem 2.25rem 0.65rem 1rem;
}

.themeToggle {
  position: relative;
}

.themeToggle::after {
  color: var(--color-muted);
  content: '⌄';
  font-size: 1.25rem;
  pointer-events: none;
  position: absolute;
  right: 0.85rem;
  top: 50%;
  transform: translateY(-55%);
}

select:focus {
  border-color: var(--color-primary);
  outline: 3px solid var(--color-focus);
}

@media (max-width: 620px) {
  .themeToggle span {
    display: none;
  }

  select {
    max-width: 7.5rem;
  }
}
</style>