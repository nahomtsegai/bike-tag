import { describe, expect, it, vi } from "vitest";
import { assertHumanSubmission } from "../../server/utils/botProtection";

describe("submit bot protection", () => {
  it("allows a verified human submission", async () => {
    await expect(
      assertHumanSubmission({
        verifier: async () => ({ isBot: false }),
      }),
    ).resolves.toBeUndefined();
  });

  it("rejects automated submissions", async () => {
    await expect(
      assertHumanSubmission({
        verifier: async () => ({ isBot: true }),
      }),
    ).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: "Automated submissions are not allowed.",
    });
  });

  it("fails closed when BotID verification is unavailable", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      assertHumanSubmission({
        verifier: async () => {
          throw new Error("verification unavailable");
        },
      }),
    ).rejects.toMatchObject({
      statusCode: 503,
      statusMessage: "Submission verification is temporarily unavailable.",
    });

    expect(consoleError).toHaveBeenCalledWith(
      "[bot-protection] BotID verification failed.",
      expect.objectContaining({
        error: expect.any(Error),
      }),
    );

    consoleError.mockRestore();
  });
});
