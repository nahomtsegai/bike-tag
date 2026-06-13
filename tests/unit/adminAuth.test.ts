import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  adminSupabaseAccessTokenCookieName,
  getAdminSupabaseAccessTokenCookieOptions,
} from "../../server/utils/adminAuth";

describe("adminAuth cookie configuration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-13T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses a dedicated cookie name for the Supabase admin session", () => {
    expect(adminSupabaseAccessTokenCookieName).toBe(
      "bike-tag-admin-supabase-access-token",
    );
  });

  it("keeps the Supabase admin cookie httpOnly and scoped to admin APIs", () => {
    expect(getAdminSupabaseAccessTokenCookieOptions()).toMatchObject({
      httpOnly: true,
      maxAge: 60 * 60,
      path: "/api/admin",
      sameSite: "strict",
    });
  });

  it("sets the Supabase cookie lifetime from the access token expiry", () => {
    const expiresAt = Math.floor(
      new Date("2026-06-13T12:30:00.000Z").getTime() / 1000,
    );

    expect(getAdminSupabaseAccessTokenCookieOptions(expiresAt)).toMatchObject({
      httpOnly: true,
      maxAge: 30 * 60,
      path: "/api/admin",
      sameSite: "strict",
    });
  });

  it("uses a minimum lifetime for an already expired access token", () => {
    const expiresAt = Math.floor(
      new Date("2026-06-13T11:30:00.000Z").getTime() / 1000,
    );

    expect(getAdminSupabaseAccessTokenCookieOptions(expiresAt).maxAge).toBe(1);
  });
});
