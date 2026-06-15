import { safelySendSubmitFailureAlert } from "../utils/sendSubmitFailureAlert";

const submitApiPath = "/api/tags/submit";

const getErrorRecord = (error: unknown) => {
  return typeof error === "object" && error !== null
    ? (error as Record<string, unknown>)
    : {};
};

const getErrorData = (error: unknown) => {
  const errorData = getErrorRecord(error).data;

  return typeof errorData === "object" && errorData !== null
    ? (errorData as Record<string, unknown>)
    : {};
};

const getStringValue = (
  record: Record<string, unknown>,
  key: string,
  fallbackValue: string,
) => {
  const value = record[key];

  return typeof value === "string" && value ? value : fallbackValue;
};

const getNullableStringValue = (
  record: Record<string, unknown>,
  key: string,
) => {
  const value = record[key];

  return typeof value === "string" && value ? value : null;
};

const getNumberValue = (
  record: Record<string, unknown>,
  key: string,
  fallbackValue: number,
) => {
  const value = record[key];

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : fallbackValue;
};

const getErrorStatusCode = (error: unknown) => {
  return getNumberValue(getErrorRecord(error), "statusCode", 500);
};

const getErrorStatusMessage = (error: unknown) => {
  const errorRecord = getErrorRecord(error);
  const statusMessage = errorRecord.statusMessage;

  if (typeof statusMessage === "string" && statusMessage) {
    return statusMessage;
  }

  return getErrorStatusCode(error) >= 500
    ? "Submission failed."
    : "Submission request was rejected.";
};

const getErrorName = (error: unknown) => {
  return error instanceof Error ? error.name : "UnknownError";
};

const getErrorMessage = (error: unknown) => {
  return error instanceof Error ? error.message : String(error);
};

export const isSubmitApiFailureEvent = (event: {
  method?: string;
  path?: string;
}) => {
  const requestPath = event.path?.split("?", 1)[0];

  return event.method === "POST" && requestPath === submitApiPath;
};

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", async (error, context) => {
    const event = context.event;

    if (!event || !isSubmitApiFailureEvent(event)) {
      return;
    }

    const errorData = getErrorData(error);
    const statusCode = getErrorStatusCode(error);

    await safelySendSubmitFailureAlert({
      requestId: getStringValue(
        errorData,
        "requestId",
        crypto.randomUUID(),
      ),
      clientSubmissionId: getNullableStringValue(
        errorData,
        "clientSubmissionId",
      ),
      diagnosticSessionId: getNullableStringValue(
        errorData,
        "diagnosticSessionId",
      ),
      failedServerStep: getStringValue(
        errorData,
        "currentServerStep",
        "api_unhandled_failure",
      ),
      finalServerStep: getStringValue(
        errorData,
        "finalServerStep",
        "api_submit_failed",
      ),
      statusCode,
      statusMessage: getErrorStatusMessage(error),
      errorName: getErrorName(error),
      errorMessage: getErrorMessage(error),
      durationMs: getNumberValue(errorData, "durationMs", 0),
      uploadedPhotoCount: getNumberValue(
        errorData,
        "uploadedPhotoCount",
        0,
      ),
      activeTagId: getNullableStringValue(errorData, "activeTagId"),
      submissionId: getNullableStringValue(errorData, "submissionId"),
      environment: process.env.VERCEL_ENV ?? null,
    });
  });
});
