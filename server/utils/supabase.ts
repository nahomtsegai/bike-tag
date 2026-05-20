import { createClient } from '@supabase/supabase-js'

const requiredEnvironmentVariables = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY'
] as const

const getRequiredEnvironmentVariable = (
  environmentVariableName: (typeof requiredEnvironmentVariables)[number]
) => {
  const environmentVariableValue = process.env[environmentVariableName]

  if (!environmentVariableValue) {
    throw new Error(
      `Missing required environment variable: ${environmentVariableName}`
    )
  }

  return environmentVariableValue
}

export const createSupabaseServerClient = () => {
  const supabaseUrl = getRequiredEnvironmentVariable('SUPABASE_URL')
  const supabaseServiceRoleKey = getRequiredEnvironmentVariable(
    'SUPABASE_SERVICE_ROLE_KEY'
  )

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}