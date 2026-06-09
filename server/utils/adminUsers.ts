import { createError, getHeader } from 'h3'
import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'

type AdminUser = {
  id: string
  user_id: string
  email: string
  display_name: string | null
  created_at: string
}

const getSupabaseServiceClient = () => {
  const runtimeConfig = useRuntimeConfig()

  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase admin auth is not configured.'
    })
  }

  return createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
}

const getBearerToken = (event: H3Event) => {
  const authorizationHeader = getHeader(event, 'authorization')

  if (!authorizationHeader) {
    return ''
  }

  const [scheme, token] = authorizationHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return ''
  }

  return token.trim()
}

export const getAuthenticatedAdminUser = async (event: H3Event) => {
  const accessToken = getBearerToken(event)

  if (!accessToken) {
    return null
  }

  const supabase = getSupabaseServiceClient()

  const {
    data: userData,
    error: userError
  } = await supabase.auth.getUser(accessToken)

  if (userError || !userData.user?.id || !userData.user.email) {
    return null
  }

  const {
    data: adminUser,
    error: adminUserError
  } = await supabase
    .from('admin_users')
    .select('id, user_id, email, display_name, created_at')
    .eq('user_id', userData.user.id)
    .maybeSingle<AdminUser>()

  if (adminUserError) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to verify admin access.'
    })
  }

  return adminUser
}

export const requireAuthenticatedAdminUser = async (event: H3Event) => {
  const adminUser = await getAuthenticatedAdminUser(event)

  if (!adminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access is required.'
    })
  }

  return adminUser
}