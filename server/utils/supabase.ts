import { createClient } from '@supabase/supabase-js'

const getRequiredRuntimeConfigValue = (
  value: unknown,
  environmentVariableName: string
) => {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Missing required environment variable: ${environmentVariableName}`
    )
  }

  return value
}

export const createSupabaseServerClient = () => {
  const runtimeConfig = useRuntimeConfig()

  const supabaseUrl = getRequiredRuntimeConfigValue(
    runtimeConfig.supabaseUrl,
    'SUPABASE_URL'
  )

  const supabaseServiceRoleKey = getRequiredRuntimeConfigValue(
    runtimeConfig.supabaseServiceRoleKey,
    'SUPABASE_SERVICE_ROLE_KEY'
  )

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}