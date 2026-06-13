import type { H3Event } from "h3";
import { createClient } from "@supabase/supabase-js";
import {
  adminSupabaseAccessTokenCookieName,
  getAdminSupabaseAccessTokenCookieOptions,
} from "../../../utils/adminAuth";
import {
  assertRateLimit,
  getClientIpAddress,
  getPositiveNumberConfig,
} from "../../../utils/rateLimit";

type AdminLoginRequestBody = {
  email?: string;
  password?: string;
};

type AdminUserRow = {
  id: string;
  user_id: string;
  email: string;
  display_name: string | null;
};

const getAdminLoginRateLimitConfig = () => {
  const runtimeConfig = useRuntimeConfig();

  return {
    attempts: getPositiveNumberConfig(
      runtimeConfig.adminLoginRateLimitAttempts,
      5,
    ),
    windowMs: getPositiveNumberConfig(
      runtimeConfig.adminLoginRateLimitWindowMs,
      10 * 60 * 1000,
    ),
  };
};

const assertAdminLoginRateLimit = async (event: H3Event) => {
  const rateLimitConfig = getAdminLoginRateLimitConfig();

  await assertRateLimit({
    key: `admin-login:${getClientIpAddress(event)}`,
    limit: rateLimitConfig.attempts,
    windowMs: rateLimitConfig.windowMs,
    messagePrefix: "Too many admin login attempts.",
  });
};

const getSupabaseAuthClient = () => {
  const runtimeConfig = useRuntimeConfig();

  if (!runtimeConfig.supabaseUrl || !runtimeConfig.public.supabaseAnonKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase auth is not configured.",
    });
  }

  return createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.public.supabaseAnonKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
};

const getSupabaseServiceClient = () => {
  const runtimeConfig = useRuntimeConfig();

  if (!runtimeConfig.supabaseUrl || !runtimeConfig.supabaseServiceRoleKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Supabase admin auth is not configured.",
    });
  }

  return createClient(
    runtimeConfig.supabaseUrl,
    runtimeConfig.supabaseServiceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
};

const getAdminUserByAuthUserId = async (authUserId: string) => {
  const supabase = getSupabaseServiceClient();

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, user_id, email, display_name")
    .eq("user_id", authUserId)
    .maybeSingle<AdminUserRow>();

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: "Unable to verify admin access.",
    });
  }

  return data;
};

const signInWithSupabaseAuth = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  const supabase = getSupabaseAuthClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user || !data.session) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access is required.",
    });
  }

  const adminUser = await getAdminUserByAuthUserId(data.user.id);

  if (!adminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access is required.",
    });
  }

  return {
    adminUser,
    session: data.session,
  };
};

export default defineEventHandler(async (event) => {
  await assertAdminLoginRateLimit(event);

  const body = await readBody<AdminLoginRequestBody>(event);
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Email and password are required.",
    });
  }

  const { adminUser, session } = await signInWithSupabaseAuth({
    email,
    password,
  });

  setCookie(
    event,
    adminSupabaseAccessTokenCookieName,
    session.access_token,
    getAdminSupabaseAccessTokenCookieOptions(session.expires_at),
  );

  return {
    isAuthenticated: true,
    authType: "supabase",
    expiresAt: session.expires_at,
    adminUser: {
      id: adminUser.id,
      email: adminUser.email,
      displayName: adminUser.display_name,
    },
  };
});
