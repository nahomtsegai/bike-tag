<script setup lang="ts">
import { computed } from 'vue'

type AppStateMessageVariant = 'loading' | 'error' | 'empty' | 'info'

const props = withDefaults(
  defineProps<{
    eyebrow?: string
    title?: string
    message: string
    variant?: AppStateMessageVariant
    actionLabel?: string
    actionTo?: string
  }>(),
  {
    eyebrow: '',
    title: '',
    variant: 'info',
    actionLabel: '',
    actionTo: ''
  }
)

const roleByVariant: Record<AppStateMessageVariant, 'status' | 'alert'> = {
  loading: 'status',
  error: 'alert',
  empty: 'status',
  info: 'status'
}

const iconLabel = computed(() => {
  if (props.variant === 'loading') {
    return 'Loading'
  }

  if (props.variant === 'error') {
    return 'Something went wrong'
  }

  if (props.variant === 'empty') {
    return 'Nothing to show yet'
  }

  return 'Information'
})
</script>

<template>
  <section
    class="appStateMessage"
    :class="`appStateMessage-${variant}`"
    :role="roleByVariant[variant]"
    :aria-live="variant === 'loading' ? 'polite' : undefined"
  >
    <div class="stateIcon" aria-hidden="true">
      <span v-if="variant === 'loading'" class="loadingSpinner" />
      <span v-else-if="variant === 'error'">!</span>
      <span v-else-if="variant === 'empty'">?</span>
      <span v-else>i</span>
    </div>

    <div class="stateContent">
      <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>

      <h2 v-if="title">{{ title }}</h2>

      <p class="stateMessage">{{ message }}</p>

      <NuxtLink
        v-if="actionLabel && actionTo"
        :to="actionTo"
        class="stateAction"
        :aria-label="`${actionLabel}. ${iconLabel}`"
      >
        {{ actionLabel }}
      </NuxtLink>
    </div>
  </section>
</template>

<style scoped>
.appStateMessage {
  align-items: start;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  color: var(--color-muted);
  display: grid;
  gap: 1rem;
  line-height: 1.6;
  margin-top: 1.5rem;
  padding: 1.25rem;
}

.appStateMessage-loading {
  border-style: dashed;
}

.appStateMessage-error {
  border-color: var(--color-error, var(--color-border-strong));
}

.appStateMessage-empty {
  border-style: dashed;
}

.stateIcon {
  align-items: center;
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  color: var(--color-text);
  display: inline-flex;
  font-size: 0.9rem;
  font-weight: 900;
  height: 2.25rem;
  justify-content: center;
  width: 2.25rem;
}

.loadingSpinner {
  animation: spin 0.8s linear infinite;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 999px;
  display: block;
  height: 1.1rem;
  width: 1.1rem;
}

.stateContent {
  display: grid;
  gap: 0.5rem;
}

.appStateMessage h2 {
  color: var(--color-text);
  font-size: 1.4rem;
  line-height: 1.2;
  margin: 0;
}

.appStateMessage p {
  margin: 0;
}

.stateMessage {
  max-width: 60ch;
}

.appStateMessage .eyebrow {
  color: var(--color-accent);
}

.stateAction {
  align-items: center;
  background: var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary-contrast);
  display: inline-flex;
  font-weight: 900;
  justify-content: center;
  margin-top: 0.5rem;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
  width: fit-content;
}

.stateAction:hover {
  filter: brightness(0.96);
}

@media (min-width: 640px) {
  .appStateMessage {
    grid-template-columns: auto 1fr;
    padding: 1.5rem;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>