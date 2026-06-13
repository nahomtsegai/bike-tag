import type { H3Event } from "h3";
import { createError, getHeader } from "h3";
import { createSupabaseServerClient } from "./supabase";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
  messagePrefix?: string;
};

type RateLimitRpcRow = {
  allowed: boolean;
  current_count: number | string;
  bucket_reset_at: string;
};

const createRateLimitUnavailableError = () => {
  return createError({
    statusCode: 503,
    statusMessage: "Rate limiting is temporarily unavailable.",
  });
};

const createRateLimitKeyHash = async (key: string) => {
  const encodedKey = new TextEncoder().encode(key);

  const digest = await globalThis.crypto.subtle.digest("SHA-256", encodedKey);

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
};

const isRateLimitRpcRow = (value: unknown): value is RateLimitRpcRow => {
  if (!value || typeof value !== "object") {
    return false;
  }

  return (
    "allowed" in value &&
    typeof value.allowed === "boolean" &&
    "current_count" in value &&
    (typeof value.current_count === "number" ||
      typeof value.current_count === "string") &&
    "bucket_reset_at" in value &&
    typeof value.bucket_reset_at === "string"
  );
};

const getRetryAfterSeconds = (bucketResetAt: string) => {
  const resetAtMilliseconds = Date.parse(bucketResetAt);

  if (!Number.isFinite(resetAtMilliseconds)) {
    throw createRateLimitUnavailableError();
  }

  return Math.max(1, Math.ceil((resetAtMilliseconds - Date.now()) / 1000));
};

export const getClientIpAddress = (event: H3Event) => {
  const forwardedFor = getHeader(event, "x-forwarded-for");

  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown";
  }

  return getHeader(event, "x-real-ip") || "unknown";
};

export const getPositiveNumberConfig = (
  value: unknown,
  fallbackValue: number,
) => {
  const numericValue = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return fallbackValue;
  }

  return numericValue;
};

export const assertRateLimit = async ({
  key,
  limit,
  windowMs,
  messagePrefix = "Too many submit attempts.",
}: RateLimitOptions) => {
  const normalizedKey = key.trim();
  const normalizedLimit = Math.max(1, Math.floor(limit));
  const normalizedWindowMs = Math.max(1, Math.floor(windowMs));

  if (!normalizedKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Rate-limit key is required.",
    });
  }

  const supabase = createSupabaseServerClient();

  const { data, error } = await supabase.rpc("consume_rate_limit", {
    p_key_hash: await createRateLimitKeyHash(normalizedKey),
    p_limit: normalizedLimit,
    p_window_ms: normalizedWindowMs,
  });

  if (error) {
    throw createRateLimitUnavailableError();
  }

  if (!Array.isArray(data) || !isRateLimitRpcRow(data[0])) {
    throw createRateLimitUnavailableError();
  }

  const rateLimitResult = data[0];

  if (rateLimitResult.allowed) {
    return;
  }

  const retryAfterSeconds = getRetryAfterSeconds(
    rateLimitResult.bucket_reset_at,
  );

  throw createError({
    statusCode: 429,
    statusMessage: `${messagePrefix} Try again in ${retryAfterSeconds} seconds.`,
  });
};
