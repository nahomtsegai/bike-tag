import { checkBotId } from "botid/server";
import { createError } from "h3";

type BotVerification = {
  isBot: boolean;
};

type BotVerifier = () => Promise<BotVerification>;

const verifyWithBotId: BotVerifier = async () => {
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
