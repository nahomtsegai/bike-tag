import { createClient } from '@supabase/supabase-js'

const getRequiredRuntimeConfigValue = (
  value: unknown,
  environmentVariableName: string
) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw createError({
      statusCode: 500,
      statusMessage: `Missing required environment variable: ${environmentVariableName}`
    })
  }

  return value
}

export const createSupabaseServerClient = () => {
  const runtimeConfig = useRuntimeConfig()

  const supabaseUrl = getRequiredRuntimeConfigValue(
    runtimeConfig.supabaseUrl,
    'NUXT_SUPABASE_URL'
  )

  const supabaseServiceRoleKey = getRequiredRuntimeConfigValue(
    runtimeConfig.supabaseServiceRoleKey,
    'NUXT_SUPABASE_SERVICE_ROLE_KEY'
  )

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}