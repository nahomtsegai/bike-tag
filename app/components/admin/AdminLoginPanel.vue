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

      <input :value="adminEmail" type="email" autocomplete="email" placeholder="Enter admin email"
        @input="updateAdminEmail">
    </label>

    <label class="field">
      <span>Admin password</span>

      <input :value="adminPassword" type="password" autocomplete="current-password" placeholder="Enter admin password"
        @input="updateAdminPassword">
    </label>

    <div class="button-row">
      <button class="primary-button" type="button" :disabled="!canSubmitAdminLogin" @click="$emit('submit')">
        Sign in
      </button>

      <button class="secondary-button" type="button" @click="$emit('clear')">
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

@media (max-width: 520px) {
  input {
    font-size: 1rem;
  }
}
</style>
