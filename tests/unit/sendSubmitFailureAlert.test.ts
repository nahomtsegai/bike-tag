import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockAssertRateLimit, mockEmailSend } = vi.hoisted(() => {
  return {
    mockAssertRateLimit: vi.fn(),
    mockEmailSend: vi.fn(),
  };
});

vi.mock("resend", () => {
  return {
    Resend: class {
      emails = {
        send: mockEmailSend,
      };
    },
  };
});

vi.mock("../../server/utils/rateLimit", () => {
  return {
    assertRateLimit: mockAssertRateLimit,
    getPositiveNumberConfig: (value: unknown, fallbackValue: number) => {
      const numericValue = typeof value === "number" ? value : Number(value);

      return Number.isFinite(numericValue) && numericValue > 0
        ? numericValue
        : fallbackValue;
    },
  };
});

import {
  safelySendSubmitFailureAlert,
  sendSubmitFailureAlert,
  shouldSendSubmitFailureAlert,
  type SubmitFailureAlertPayload,
} from "../../server/utils/sendSubmitFailureAlert";

const runtimeConfig = {
  resendApiKey: "resend-api-key",
  adminNotificationEmail: "admin@example.com",
  fromEmail: "Bike Tag <alerts@example.com>",
  submitFailureAlertThreshold: 3,
  submitFailureAlertThresholdWindowMs: 600_000,
  submitFailureAlertAttempts: 1,
  submitFailureAlertWindowMs: 3_600_000,
  public: {
    siteUrl: "https://www.louisvillebiketag.com",
  },
};

const alertPayload: SubmitFailureAlertPayload = {
  requestId: "request-123",
  clientSubmissionId: "client-123",
  diagnosticSessionId: "diagnostic-123",
  failedServerStep: "api_submission_insert_started",
  finalServerStep: "api_cleanup_succeeded",
  statusCode: 500,
  statusMessage: "Submission failed.",
  errorName: "Error",
  errorMessage: "Database unavailable",
  durationMs: 1250,
  uploadedPhotoCount: 2,
  activeTagId: "tag-123",
  submissionId: null,
  environment: "production",
  occurredAt: new Date("2026-06-15T16:00:00.000Z"),
};

const mockThresholdReachedAndCooldownAvailable = () => {
  mockAssertRateLimit
    .mockRejectedValueOnce({ statusCode: 429 })
    .mockResolvedValueOnce(undefined);
};

describe("sendSubmitFailureAlert", () => {
  beforeEach(() => {
    vi.stubGlobal("useRuntimeConfig", () => runtimeConfig);
    mockAssertRateLimit.mockReset();
    mockEmailSend.mockReset();
    mockThresholdReachedAndCooldownAvailable();
    mockEmailSend.mockResolvedValue({ data: { id: "email-123" }, error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("sends a production alert after the repeated-failure threshold", async () => {
    await expect(sendSubmitFailureAlert(alertPayload)).resolves.toBe("sent");

    expect(mockAssertRateLimit).toHaveBeenNthCalledWith(1, {
      key: "submit-failure-threshold:api_submission_insert_started",
      limit: 2,
      windowMs: 600_000,
      messagePrefix: "Submit failure threshold reached.",
    });
    expect(mockAssertRateLimit).toHaveBeenNthCalledWith(2, {
      key: "submit-failure-alert:api_submission_insert_started",
      limit: 1,
      windowMs: 3_600_000,
      messagePrefix: "Submit failure alert suppressed.",
    });
    expect(mockEmailSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: runtimeConfig.fromEmail,
        to: runtimeConfig.adminNotificationEmail,
        subject:
          "Bike Tag production submit failures: api_submission_insert_started",
        text: expect.stringContaining("3 failures within 10 minutes"),
        html: expect.stringContaining(
          "https://www.louisvillebiketag.com/admin/errors",
        ),
      }),
    );
  });

  it("does not alert before the repeated-failure threshold", async () => {
    mockAssertRateLimit.mockReset();
    mockAssertRateLimit.mockResolvedValueOnce(undefined);

    await expect(sendSubmitFailureAlert(alertPayload)).resolves.toBe(
      "skipped_below_threshold",
    );

    expect(mockAssertRateLimit).toHaveBeenCalledOnce();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does not alert for a normal 4xx validation failure", async () => {
    await expect(
      sendSubmitFailureAlert({
        ...alertPayload,
        statusCode: 400,
        statusMessage: "Invalid map link.",
      }),
    ).resolves.toBe("skipped_client_error");

    expect(mockAssertRateLimit).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("does not alert outside the production Vercel environment", async () => {
    await expect(
      sendSubmitFailureAlert({
        ...alertPayload,
        environment: "preview",
      }),
    ).resolves.toBe("skipped_non_production");

    expect(mockAssertRateLimit).not.toHaveBeenCalled();
    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("suppresses alerts during the cooldown window", async () => {
    mockAssertRateLimit.mockReset();
    mockAssertRateLimit
      .mockRejectedValueOnce({ statusCode: 429 })
      .mockRejectedValueOnce({ statusCode: 429 });

    await expect(sendSubmitFailureAlert(alertPayload)).resolves.toBe(
      "skipped_rate_limited",
    );

    expect(mockEmailSend).not.toHaveBeenCalled();
  });

  it("fails open when the threshold limiter is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockAssertRateLimit.mockReset();
    mockAssertRateLimit
      .mockRejectedValueOnce({ statusCode: 503 })
      .mockResolvedValueOnce(undefined);

    await expect(sendSubmitFailureAlert(alertPayload)).resolves.toBe("sent");

    expect(mockEmailSend).toHaveBeenCalledOnce();
  });

  it("fails open when the cooldown limiter is unavailable", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockAssertRateLimit.mockReset();
    mockAssertRateLimit
      .mockRejectedValueOnce({ statusCode: 429 })
      .mockRejectedValueOnce({ statusCode: 503 });

    await expect(sendSubmitFailureAlert(alertPayload)).resolves.toBe("sent");

    expect(mockEmailSend).toHaveBeenCalledOnce();
  });

  it("never throws when the email provider rejects the request", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockEmailSend.mockRejectedValue(new Error("Resend unavailable"));

    await expect(safelySendSubmitFailureAlert(alertPayload)).resolves.toBe(
      "failed",
    );
  });

  it("never throws when the email provider returns an error response", async () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    mockEmailSend.mockResolvedValue({
      data: null,
      error: {
        message: "Domain is not verified",
      },
    });

    await expect(safelySendSubmitFailureAlert(alertPayload)).resolves.toBe(
      "failed",
    );
  });

  it("identifies only production 5xx failures as alertable", () => {
    expect(
      shouldSendSubmitFailureAlert({
        statusCode: 500,
        environment: "production",
      }),
    ).toBe(true);
    expect(
      shouldSendSubmitFailureAlert({
        statusCode: 400,
        environment: "production",
      }),
    ).toBe(false);
    expect(
      shouldSendSubmitFailureAlert({
        statusCode: 500,
        environment: "preview",
      }),
    ).toBe(false);
  });
});
