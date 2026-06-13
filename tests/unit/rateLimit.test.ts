import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockRpc } = vi.hoisted(() => {
  return {
    mockRpc: vi.fn(),
  };
});

vi.mock("../../server/utils/supabase", () => {
  return {
    createSupabaseServerClient: () => ({
      rpc: mockRpc,
    }),
  };
});

import {
  assertRateLimit,
  getPositiveNumberConfig,
} from "../../server/utils/rateLimit";

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-13T12:00:00.000Z"));
    mockRpc.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getPositiveNumberConfig", () => {
    it("returns the configured positive number", () => {
      expect(getPositiveNumberConfig("12", 5)).toBe(12);
      expect(getPositiveNumberConfig(8, 5)).toBe(8);
    });

    it("returns the fallback for invalid values", () => {
      expect(getPositiveNumberConfig("", 5)).toBe(5);
      expect(getPositiveNumberConfig(0, 5)).toBe(5);
      expect(getPositiveNumberConfig(-1, 5)).toBe(5);
      expect(getPositiveNumberConfig("nope", 5)).toBe(5);
    });
  });

  describe("assertRateLimit", () => {
    it("allows a request when the durable limiter allows it", async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            allowed: true,
            current_count: 1,
            bucket_reset_at: "2026-06-13T12:01:00.000Z",
          },
        ],
        error: null,
      });

      await expect(
        assertRateLimit({
          key: "submit-diagnostics:test-ip",
          limit: 2,
          windowMs: 60_000,
          messagePrefix: "Too many diagnostic events.",
        }),
      ).resolves.toBeUndefined();

      expect(mockRpc).toHaveBeenCalledWith("consume_rate_limit", {
        p_key_hash: expect.stringMatching(/^[0-9a-f]{64}$/),
        p_limit: 2,
        p_window_ms: 60_000,
      });

      const rpcArguments = mockRpc.mock.calls[0]?.[1];

      expect(rpcArguments.p_key_hash).not.toContain("test-ip");
    });

    it("throws a 429 error when the durable limiter rejects the request", async () => {
      mockRpc.mockResolvedValue({
        data: [
          {
            allowed: false,
            current_count: 2,
            bucket_reset_at: "2026-06-13T12:01:00.000Z",
          },
        ],
        error: null,
      });

      await expect(
        assertRateLimit({
          key: "admin-login:test-ip",
          limit: 1,
          windowMs: 60_000,
          messagePrefix: "Too many admin login attempts.",
        }),
      ).rejects.toMatchObject({
        statusCode: 429,
        statusMessage:
          "Too many admin login attempts. Try again in 60 seconds.",
      });
    });

    it("throws a 503 error when the rate-limit RPC fails", async () => {
      mockRpc.mockResolvedValue({
        data: null,
        error: {
          message: "Database unavailable",
        },
      });

      await expect(
        assertRateLimit({
          key: "submit:test-ip",
          limit: 10,
          windowMs: 60_000,
        }),
      ).rejects.toMatchObject({
        statusCode: 503,
        statusMessage: "Rate limiting is temporarily unavailable.",
      });
    });

    it("throws a 503 error for an unexpected RPC response", async () => {
      mockRpc.mockResolvedValue({
        data: [],
        error: null,
      });

      await expect(
        assertRateLimit({
          key: "submit:test-ip",
          limit: 10,
          windowMs: 60_000,
        }),
      ).rejects.toMatchObject({
        statusCode: 503,
        statusMessage: "Rate limiting is temporarily unavailable.",
      });
    });

    it("rejects an empty rate-limit key before calling Supabase", async () => {
      await expect(
        assertRateLimit({
          key: "   ",
          limit: 10,
          windowMs: 60_000,
        }),
      ).rejects.toMatchObject({
        statusCode: 500,
        statusMessage: "Rate-limit key is required.",
      });

      expect(mockRpc).not.toHaveBeenCalled();
    });
  });
});
