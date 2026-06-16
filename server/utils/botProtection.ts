import { checkBotId } from "botid/server";
import { createError } from "h3";

type BotVerification = {
  isBot: boolean;
};

type BotVerifier = () => Promise<BotVerification>;

type RuntimeGlobal = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const getVercelRuntime = () => {
  return (globalThis as RuntimeGlobal).process?.env?.VERCEL;
};

export const shouldVerifyWithBotId = (
  vercelRuntime = getVercelRuntime(),
) => vercelRuntime === "1";

const verifyWithBotId: BotVerifier = async () => {
  if (!shouldVerifyWithBotId()) {
    return { isBot: false };
  }

  return await checkBotId();
};

export const assertHumanSubmission = async ({
  verifier = verifyWithBotId,
}: {
  verifier?: BotVerifier;
} = {}) => {
  let verification: BotVerification;

  try {
    verification = await verifier();
  } catch (error) {
    console.error("[bot-protection] BotID verification failed.", {
      error,
    });

    throw createError({
      statusCode: 503,
      statusMessage: "Submission verification is temporarily unavailable.",
    });
  }

  if (verification.isBot) {
    throw createError({
      statusCode: 403,
      statusMessage: "Automated submissions are not allowed.",
    });
  }
};
