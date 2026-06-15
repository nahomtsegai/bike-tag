export const immediateSubmitRetryWindowMs = 500;
export const immediateSubmitRetryDelayMs = 750;

export const createClientSubmissionId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (value) => {
    const randomValue = Math.floor(Math.random() * 16);
    const uuidValue = value === "x" ? randomValue : (randomValue & 0x3) | 0x8;

    return uuidValue.toString(16);
  });
};

const getErrorStatusCode = (error: unknown) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof error.statusCode === "number"
  ) {
    return error.statusCode;
  }

  return null;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === "string" ? error : "";
};

export const isNoResponseSubmitError = (error: unknown) => {
  if (getErrorStatusCode(error) !== null) {
    return false;
  }

  const normalizedMessage = getErrorMessage(error).toLowerCase();

  return (
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("<no response>") ||
    normalizedMessage.includes("networkerror") ||
    normalizedMessage.includes("network request failed")
  );
};

export const isImmediateNoResponseSubmitError = ({
  error,
  durationMs,
}: {
  error: unknown;
  durationMs: number;
}) => {
  return (
    durationMs <= immediateSubmitRetryWindowMs &&
    isNoResponseSubmitError(error)
  );
};

export const waitForSubmitRetry = async (
  delayMs = immediateSubmitRetryDelayMs,
) => {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, delayMs);
  });
};
