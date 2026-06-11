<script setup lang="ts">
import {
  clearStoredAdminAccessToken,
  getAdminAuthHeaders,
  setStoredAdminAccessToken
} from '~/utils/adminTokenStorage'

type AdminSessionResponse = {
  isAuthenticated: boolean
  authType?: 'session' | 'supabase' | null
  accessToken?: string
  expiresAt?: number
  adminUser?: {
    id: string
    email: string
    displayName: string | null
  } | null
}

const adminEmail = ref('')
const adminPassword = ref('')
const isCheckingAdminSession = ref(true)
const isLoading = ref(false)
const hasValidatedAdminAccess = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const hasAdminEmail = computed(() => {
  return Boolean(adminEmail.value.trim())
})

const hasAdminPassword = computed(() => {
  return Boolean(adminPassword.value.trim())
})

const canSubmitAdminLogin = computed(() => {
  return hasAdminEmail.value && hasAdminPassword.value && !isLoading.value
})

const logInToAdminSession = ({
  email,
  password
}: {
  email: string
  password: string
}) => {
  return $fetch<AdminSessionResponse>('/api/admin/session/login', {
    method: 'POST',
    body: {
      email: email.trim(),
      password
    }
  })
}

const logOutOfAdminSession = () => {
  return $fetch<AdminSessionResponse>('/api/admin/session/logout', {
    method: 'POST'
  })
}

const getAdminSession = () => {
  return $fetch<AdminSessionResponse>('/api/admin/session', {
    headers: getAdminAuthHeaders()
  })
}

const resetAdminAccess = () => {
  hasValidatedAdminAccess.value = false
}

const clearAdminLoginForm = () => {
  adminEmail.value = ''
  adminPassword.value = ''
  errorMessage.value = ''
  successMessage.value = ''
  clearStoredAdminAccessToken()
  resetAdminAccess()
}

const submitAdminLogin = async () => {
  if (!hasAdminEmail.value || !hasAdminPassword.value) {
    errorMessage.value = 'Admin email and password are required.'
    successMessage.value = ''
    resetAdminAccess()
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const loginResponse = await logInToAdminSession({
      email: adminEmail.value,
      password: adminPassword.value
    })

    if (loginResponse.authType !== 'supabase' || !loginResponse.accessToken) {
      throw new Error('Invalid admin email or password.')
    }

    setStoredAdminAccessToken(loginResponse.accessToken)

    adminPassword.value = ''
    hasValidatedAdminAccess.value = true
    successMessage.value = ''
    errorMessage.value = ''
  } catch {
    clearStoredAdminAccessToken()
    resetAdminAccess()

    errorMessage.value = 'Invalid admin email or password.'
    successMessage.value = ''
  } finally {
    isLoading.value = false
  }
}

const signOutOfAdminSession = async () => {
  try {
    await logOutOfAdminSession()
  } catch {
    // Continue clearing local admin state even if logout fails.
  }

  clearStoredAdminAccessToken()
  adminEmail.value = ''
  adminPassword.value = ''
  resetAdminAccess()
  successMessage.value = ''
  errorMessage.value = ''
}

const restoreAdminSession = async () => {
  isCheckingAdminSession.value = true

  try {
    const session = await getAdminSession()

    if (session.isAuthenticated) {
      hasValidatedAdminAccess.value = true
      return
    }

    clearStoredAdminAccessToken()
    resetAdminAccess()
  } catch {
    clearStoredAdminAccessToken()
    resetAdminAccess()
  } finally {
    isCheckingAdminSession.value = false
  }
}

onMounted(() => {
  void restoreAdminSession()
})
</script>

<template>
  <section
    v-if="isCheckingAdminSession"
    class="admin-card"
  >
    <AppStateMessage
      variant="loading"
      message="Checking admin session..."
    />
  </section>

  <section
    v-else-if="!hasValidatedAdminAccess"
    class="admin-card"
  >
    <div class="section-header">
      <div>
        <p class="eyebrow">Admin Login</p>
        <h2>Sign in</h2>
      </div>
    </div>

    <form
      class="admin-login-form"
      @submit.prevent="void submitAdminLogin()"
    >
      <label class="field admin-login-field">
        <span>Admin email</span>
        <input
          v-model="adminEmail"
          type="email"
          autocomplete="email"
          placeholder="Enter admin email"
          required
        >
      </label>

      <label class="field admin-login-field">
        <span>Admin password</span>
        <input
          v-model="adminPassword"
          type="password"
          autocomplete="current-password"
          placeholder="Enter admin password"
          required
        >
      </label>

      <div class="button-row admin-login-actions">
        <button
          class="primary-button"
          type="submit"
          :disabled="!canSubmitAdminLogin"
        >
          {{ isLoading ? 'Signing in...' : 'Sign in' }}
        </button>

        <button
          class="secondary-button"
          type="button"
          :disabled="isLoading"
          @click="clearAdminLoginForm"
        >
          Clear
        </button>
      </div>
    </form>

    <p class="helper-text">
      Sign in with your approved admin email and password. Admin access is limited to users listed in the admin users table.
    </p>

    <p
      v-if="errorMessage"
      class="error-message"
    >
      {{ errorMessage }}
    </p>

    <p
      v-if="successMessage"
      class="success-message"
    >
      {{ successMessage }}
    </p>
  </section>

  <template v-else>
    <section class="admin-access-bar">
      <div>
        <p class="eyebrow">Admin Session</p>
        <p class="access-status">Signed in</p>
      </div>

      <button
        class="secondary-button"
        type="button"
        @click="void signOutOfAdminSession()"
      >
        Sign out
      </button>
    </section>

    <AdminNav />

    <slot />
  </template>
</template>

<style scoped>
.admin-card,
.admin-access-bar {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.28);
  border-radius: 1.5rem;
  box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.08);
  padding: 1.25rem;
}

.admin-access-bar {
  align-items: center;
  background: rgba(236, 253, 245, 0.9);
  border-color: rgba(16, 185, 129, 0.24);
  display: flex;
  gap: 1rem;
  justify-content: space-between;
}

.access-status {
  color: #065f46;
  font-weight: 900;
  margin: 0.25rem 0 0;
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
  margin-top: 1rem;
}

.field span {
  color: #334155;
  font-size: 0.9rem;
  font-weight: 700;
}

.admin-login-form {
  display: grid;
  gap: 1rem;
}

.admin-login-field {
  margin-top: 0;
}

.admin-login-actions {
  margin-top: 0.25rem;
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

.error-message,
.success-message {
  border-radius: 1rem;
  font-weight: 700;
  margin: 1rem 0 0;
  padding: 1rem;
}

.error-message {
  background: #fef2f2;
  color: #991b1b;
}

.success-message {
  background: #ecfdf5;
  color: #065f46;
}

@media (max-width: 860px) {
  .admin-card,
  .admin-access-bar {
    border-radius: 1.25rem;
    padding: 1rem;
  }

  .admin-access-bar {
    align-items: stretch;
    flex-direction: column;
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
</style>