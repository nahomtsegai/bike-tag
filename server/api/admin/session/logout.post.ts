import {
  adminSupabaseAccessTokenCookieName,
  getAdminSupabaseAccessTokenCookieOptions,
} from "../../../utils/adminAuth";

export default defineEventHandler((event) => {
  deleteCookie(
    event,
    adminSupabaseAccessTokenCookieName,
    getAdminSupabaseAccessTokenCookieOptions(),
  );

  return {
    isAuthenticated: false,
    authType: null,
    adminUser: null,
  };
});
