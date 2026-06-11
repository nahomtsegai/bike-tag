<template>
  <section class="admin-card">
    <div class="section-header">
      <div>
        <p class="eyebrow">Admin Login</p>

        <h2>Sign in</h2>
      </div>
    </div>

    <label class="field">
      <span>Admin email</span>

      <input
        :value="adminEmail"
        type="email"
        autocomplete="email"
        placeholder="Enter admin email"
        @input="updateAdminEmail"
      >
    </label>

    <label class="field">
      <span>Admin password</span>

      <input
        :value="adminPassword"
        type="password"
        autocomplete="current-password"
        placeholder="Enter admin password"
        @input="updateAdminPassword"
      >
    </label>

    <div class="button-row">
      <button
        class="primary-button"
        type="button"
        :disabled="!canSubmitAdminLogin"
        @click="$emit('submit')"
      >
        Sign in
      </button>

      <button
        class="secondary-button"
        type="button"
        @click="$emit('clear')"
      >
        Clear
      </button>
    </div>

    <p class="helper-text">
      Sign in with your approved admin email and password. Admin access is
      limited to users listed in the admin users table.
    </p>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  adminEmail: string
  adminPassword: string
  canSubmitAdminLogin: boolean
}>()

const emit = defineEmits<{
  clear: []
  submit: []
  'update:adminEmail': [value: string]
  'update:adminPassword': [value: string]
}>()

const getInputValue = (event: Event) => {
  return event.target instanceof HTMLInputElement ? event.target.value : ''
}

const updateAdminEmail = (event: Event) => {
  emit('update:adminEmail', getInputValue(event))
}

const updateAdminPassword = (event: Event) => {
  emit('update:adminPassword', getInputValue(event))
}
</script>

<style scoped>
.admin-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.section-header {
  align-items: center;
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.section-header h2 {
  color: #0f172a;
  font-size: 1.5rem;
  margin: 0.25rem 0 0;
}

.eyebrow {
  color: #0f766e;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  margin: 0;
  text-transform: uppercase;
}

.field {
  display: grid;
  gap: 0.45rem;
}

.field + .field {
  margin-top: 1rem;
}

.field span {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
}

input {
  background: #fff;
  border: 1px solid rgba(100, 116, 139, 0.38);
  border-radius: 999px;
  color: #0f172a;
  font: inherit;
  padding: 0.85rem 1rem;
  width: 100%;
}

input:focus {
  border-color: #0f766e;
  outline: 3px solid rgba(20, 184, 166, 0.18);
}

.button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1rem;
}

.primary-button,
.secondary-button {
  border: 0;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  padding: 0.85rem 1.15rem;
}

.primary-button {
  background: #0f172a;
  color: #fff;
}

.secondary-button {
  background: #e2e8f0;
  color: #0f172a;
}

.primary-button:disabled,
.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.helper-text {
  color: #64748b;
  margin: 1rem 0 0;
}

@media (max-width: 860px) {
  .admin-card {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .section-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.5rem;
  }

  .button-row {
    display: grid;
    grid-template-columns: 1fr;
  }

  .primary-button,
  .secondary-button {
    min-height: 3rem;
    width: 100%;
  }
}

@media (max-width: 520px) {
  input {
    font-size: 1rem;
  }
}
</style>