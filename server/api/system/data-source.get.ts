type TagDataSource = 'mock' | 'supabase'

const isDevelopmentEnvironment = () => {
  return import.meta.dev
}

const assertSystemStatusIsAllowed = () => {
  if (!isDevelopmentEnvironment()) {
    throw createError({
      statusCode: 403,
      statusMessage: 'System status is only available in development.'
    })
  }
}

const isTagDataSource = (value: unknown): value is TagDataSource => {
  return value === 'mock' || value === 'supabase'
}

const hasRuntimeConfigValue = (value: unknown) => {
  return typeof value === 'string' && Boolean(value.trim())
}

export default defineEventHandler(() => {
  assertSystemStatusIsAllowed()

  const runtimeConfig = useRuntimeConfig()

  const configuredTagDataSource = runtimeConfig.tagDataSource
  const tagDataSource = isTagDataSource(configuredTagDataSource)
    ? configuredTagDataSource
    : 'mock'

  return {
    tagDataSource,
    supabase: {
      hasUrl: hasRuntimeConfigValue(runtimeConfig.supabaseUrl),
      hasServiceRoleKey: hasRuntimeConfigValue(
        runtimeConfig.supabaseServiceRoleKey
      ),
      storageBucket: runtimeConfig.supabaseStorageBucket || ''
    }
  }
})