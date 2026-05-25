<script setup lang="ts">
type AppStateMessageVariant = 'loading' | 'error' | 'empty' | 'info'

withDefaults(
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
</script>

<template>
  <section
    class="appStateMessage"
    :class="`appStateMessage-${variant}`"
    :role="roleByVariant[variant]"
  >
    <p v-if="eyebrow" class="eyebrow">{{ eyebrow }}</p>

    <h2 v-if="title">{{ title }}</h2>

    <p>{{ message }}</p>

    <NuxtLink
      v-if="actionLabel && actionTo"
      :to="actionTo"
      class="stateAction"
    >
      {{ actionLabel }}
    </NuxtLink>
  </section>
</template>

<style scoped>
.appStateMessage {
  border: 1px dashed var(--color-border-strong);
  border-radius: 1.5rem;
  color: var(--color-muted);
  line-height: 1.6;
  margin-top: 1.5rem;
  padding: 2rem 1.25rem;
  text-align: center;
}

.appStateMessage-error {
  border-style: solid;
}

.appStateMessage h2 {
  color: var(--color-text);
  font-size: 1.4rem;
  margin: 0 0 0.5rem;
}

.appStateMessage p {
  margin: 0;
}

.appStateMessage .eyebrow {
  margin-bottom: 0.5rem;
}

.stateAction {
  align-items: center;
  background: var(--color-primary);
  border-radius: 999px;
  color: var(--color-primary-contrast);
  display: inline-flex;
  font-weight: 900;
  justify-content: center;
  margin-top: 1rem;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  text-decoration: none;
}

.stateAction:hover {
  filter: brightness(0.96);
}
</style>