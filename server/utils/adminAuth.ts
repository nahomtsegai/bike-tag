export const adminSupabaseAccessTokenCookieName =
  "bike-tag-admin-supabase-access-token";

const getBaseAdminCookieOptions = () => {
  return {
    httpOnly: true,
    path: "/api/admin",
    sameSite: "strict" as const,
    secure: !import.meta.dev,
  };
};

const getSupabaseAccessTokenCookieMaxAge = (expiresAt?: number) => {
  const fallbackMaxAgeSeconds = 60 * 60;

  if (!Number.isFinite(expiresAt)) {
    return fallbackMaxAgeSeconds;
  }

  const currentTimeSeconds = Math.floor(Date.now() / 1000);
  const remainingLifetimeSeconds = Math.floor(
    (expiresAt as number) - currentTimeSeconds,
  );

  return Math.max(1, remainingLifetimeSeconds);
};

export const getAdminSupabaseAccessTokenCookieOptions = (
  expiresAt?: number,
) => {
  return {
    ...getBaseAdminCookieOptions(),
    maxAge: getSupabaseAccessTokenCookieMaxAge(expiresAt),
  };
};

export const assertAdminRequestAccess = async (
  event: Parameters<typeof getCookie>[0],
) => {
  const adminUser = await getAuthenticatedAdminUser(event);

  if (!adminUser) {
    throw createError({
      statusCode: 403,
      statusMessage: "Admin access is required.",
    });
  }

  return {
    authType: "supabase" as const,
    adminUser,
  };
};
