import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSafelySendSubmitFailureAlert } = vi.hoisted(() => {
  return {
    mockSafelySendSubmitFailureAlert: vi.fn(),
  };
});

vi.mock("../../server/utils/sendSubmitFailureAlert", () => {
  return {
    safelySendSubmitFailureAlert: mockSafelySendSubmitFailureAlert,
  };
});

type ErrorHook = (
  error: unknown,
  context: {
    event?: {
      method?: string;
      path?: string;
    };
  },
) => Promise<void>;

describe("submitFailureAlerts Nitro plugin", () => {
  beforeEach(() => {
    vi.resetModules();
    mockSafelySendSubmitFailureAlert.mockReset();
    mockSafelySendSubmitFailureAlert.mockResolvedValue("sent");
    vi.stubGlobal("defineNitroPlugin", (plugin: unknown) => plugin);
  });

  it("forwards production submit API error metadata to the safe alert sender", async () => {
    const hook = vi.fn();
    const { default: registerPlugin } = await import(
      "../../server/plugins/submitFailureAlerts"
    );

    registerPlugin({ hooks: { hook } } as never);

    expect(hook).toHaveBeenCalledWith("error", expect.any(Function));

    const errorHook = hook.mock.calls[0]?.[1] as ErrorHook;
    const error = Object.assign(new Error("Database unavailable"), {
      statusCode: 500,
      statusMessage: "Submission failed.",
      data: {
        requestId: "request-123",
        clientSubmissionId: "client-123",
        diagnosticSessionId: "diagnostic-123",
        currentServerStep: "api_submission_insert_started",
        finalServerStep: "api_cleanup_succeeded",
        durationMs: 850,
        uploadedPhotoCount: 2,
        activeTagId: "tag-123",
        submissionId: null,
      },
    });

    await expect(
      errorHook(error, {
        event: {
          method: "POST",
          path: "/api/tags/submit",
        },
      }),
    ).resolves.toBeUndefined();

    expect(mockSafelySendSubmitFailureAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        requestId: "request-123",
        clientSubmissionId: "client-123",
        diagnosticSessionId: "diagnostic-123",
        failedServerStep: "api_submission_insert_started",
        finalServerStep: "api_cleanup_succeeded",
        statusCode: 500,
        statusMessage: "Submission failed.",
        errorName: "Error",
        errorMessage: "Database unavailable",
        durationMs: 850,
        uploadedPhotoCount: 2,
        activeTagId: "tag-123",
        submissionId: null,
      }),
    );
  });

  it("ignores errors from routes other than the submit API", async () => {
    const hook = vi.fn();
    const { default: registerPlugin } = await import(
      "../../server/plugins/submitFailureAlerts"
    );

    registerPlugin({ hooks: { hook } } as never);
    const errorHook = hook.mock.calls[0]?.[1] as ErrorHook;

    await errorHook(new Error("Other route failed"), {
      event: {
        method: "GET",
        path: "/api/tags/current",
      },
    });

    expect(mockSafelySendSubmitFailureAlert).not.toHaveBeenCalled();
  });

  it("does not throw when the safe alert sender reports a provider failure", async () => {
    mockSafelySendSubmitFailureAlert.mockResolvedValue("failed");

    const hook = vi.fn();
    const { default: registerPlugin } = await import(
      "../../server/plugins/submitFailureAlerts"
    );

    registerPlugin({ hooks: { hook } } as never);
    const errorHook = hook.mock.calls[0]?.[1] as ErrorHook;

    await expect(
      errorHook(
        Object.assign(new Error("Submit failed"), {
          statusCode: 500,
        }),
        {
          event: {
            method: "POST",
            path: "/api/tags/submit?retry=1",
          },
        },
      ),
    ).resolves.toBeUndefined();
  });
});
