import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'

const storageKey = 'bike-tag-theme'
const themePreference = ref<ThemePreference>('system')
const systemTheme = ref<ResolvedTheme>('light')

const getStoredThemePreference = (): ThemePreference => {
  if (!import.meta.client) {
    return 'system'
  }

  const storedTheme = window.localStorage.getItem(storageKey)

  if (
    storedTheme === 'light' ||
    storedTheme === 'dark' ||
    storedTheme === 'system'
  ) {
    return storedTheme
  }

  return 'system'
}

const getSystemTheme = (): ResolvedTheme => {
  if (!import.meta.client) {
    return 'light'
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

const applyTheme = (theme: ResolvedTheme) => {
  if (!import.meta.client) {
    return
  }

  document.documentElement.dataset.theme = theme
}

export const useTheme = () => {
  const resolvedTheme = computed<ResolvedTheme>(() => {
    if (themePreference.value === 'system') {
      return systemTheme.value
    }

    return themePreference.value
  })

  const setThemePreference = (nextThemePreference: ThemePreference) => {
    themePreference.value = nextThemePreference

    if (import.meta.client) {
      window.localStorage.setItem(storageKey, nextThemePreference)
      applyTheme(resolvedTheme.value)
    }
  }

  const handleSystemThemeChange = () => {
    systemTheme.value = getSystemTheme()
    applyTheme(resolvedTheme.value)
  }

  onMounted(() => {
    themePreference.value = getStoredThemePreference()
    systemTheme.value = getSystemTheme()
    applyTheme(resolvedTheme.value)

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)
  })

  onBeforeUnmount(() => {
    if (!import.meta.client) {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.removeEventListener('change', handleSystemThemeChange)
  })

  return {
    themePreference,
    resolvedTheme,
    setThemePreference
  }
}