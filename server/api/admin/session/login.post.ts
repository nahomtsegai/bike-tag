import { createClient } from '@supabase/supabase-js'
import {
  adminSessionCookieName,
  assertValidAdminApiToken,
  getAdminSessionCookieOptions
} from '../../../utils/adminAuth'

type AdminLoginRequestBody = {
  adminToken?: string
  email?: string
  password?: string
}

type AdminUserRow = {
  id: string
  user_id: string
  email: string
  display_name: string | null
}

const getSupabaseAuthClient = () => {
  const runtimeConfig = useRuntimeConfig()

  if (!runtimeConfig.supabaseUrl || !runtimeConfig.public.supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase auth is not configured.'
    })
  }

  return createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.public.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  )
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

const getAdminUserByAuthUserId = async (authUserId: string) => {
  const supabase = getSupabaseServiceClient()

  const {
    data,
    error
  } = await supabase
    .from('admin_users')
    .select('id, user_id, email, display_name')
    .eq('user_id', authUserId)
    .maybeSingle<AdminUserRow>()

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to verify admin access.'
    })
  }

  return data
}

const signInWithSupabaseAuth = async ({
  email,
  password
}: {
  email: string
  password: string
}) => {
  const supabase = getSupabaseAuthClient()

  const {
    data,
    error
  } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error || !data.user || !data.session) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access is required.'
    })
  }

  const adminUser = await getAdminUserByAuthUserId(data.user.id)

  if (!adminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access is required.'
    })
  }

  return {
    adminUser,
    session: data.session
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<AdminLoginRequestBody>(event)

  const adminToken = body.adminToken?.trim() ?? ''
  const email = body.email?.trim() ?? ''
  const password = body.password ?? ''

  if (email || password) {
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required.'
      })
    }

    const {
      adminUser,
      session
    } = await signInWithSupabaseAuth({
      email,
      password
    })

    return {
      isAuthenticated: true,
      authType: 'supabase',
      accessToken: session.access_token,
      expiresAt: session.expires_at,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        displayName: adminUser.display_name
      }
    }
  }

  assertValidAdminApiToken(adminToken)

  setCookie(
    event,
    adminSessionCookieName,
    adminToken,
    getAdminSessionCookieOptions()
  )

  return {
    isAuthenticated: true,
    authType: 'session'
  }
})