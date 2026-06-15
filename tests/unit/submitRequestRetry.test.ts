import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createClientSubmissionId,
  immediateSubmitRetryWindowMs,
  isImmediateNoResponseSubmitError,
  isNoResponseSubmitError,
} from "../../app/utils/submitRequestRetry";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isImmediateNoResponseSubmitError", () => {
  it("retries an immediate fetch failure without a response status", () => {
    expect(
      isImmediateNoResponseSubmitError({
        error: new Error(
          '[POST] "/api/tags/submit": <no response> Failed to fetch',
        ),
        durationMs: 36,
      }),
    ).toBe(true);
  });

  it("does not retry a network error after the immediate retry window", () => {
    expect(
      isImmediateNoResponseSubmitError({
        error: new Error("Failed to fetch"),
        durationMs: immediateSubmitRetryWindowMs + 1,
      }),
    ).toBe(false);
  });

  it("does not retry an HTTP response error", () => {
    expect(
      isImmediateNoResponseSubmitError({
        error: {
          message: "Failed to fetch",
          statusCode: 500,
        },
        durationMs: 20,
      }),
    ).toBe(false);
  });

  it("does not retry unrelated client errors", () => {
    expect(
      isImmediateNoResponseSubmitError({
        error: new Error("Photo preparation failed"),
        durationMs: 20,
      }),
    ).toBe(false);
  });
});


describe("isNoResponseSubmitError", () => {
  it("recognizes no-response fetch failures regardless of duration", () => {
    expect(isNoResponseSubmitError(new Error("Network request failed"))).toBe(
      true,
    );
  });

  it("does not classify HTTP response errors as no-response failures", () => {
    expect(
      isNoResponseSubmitError({
        message: "Failed to fetch",
        statusCode: 503,
      }),
    ).toBe(false);
  });
});


describe("createClientSubmissionId", () => {
  it("creates a stable UUID-shaped request identifier when randomUUID is available", () => {
    const randomUUID = vi.fn(() => "11111111-1111-4111-8111-111111111111");

    vi.stubGlobal("crypto", { randomUUID });

    expect(createClientSubmissionId()).toBe(
      "11111111-1111-4111-8111-111111111111",
    );

  });
});
