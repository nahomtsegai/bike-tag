import { Resend } from "resend";
import { assertRateLimit, getPositiveNumberConfig } from "./rateLimit";
import { resolveSubmissionNotificationConfig } from "./sendSubmissionNotification";

export type SubmitFailureAlertPayload = {
  requestId: string;
  clientSubmissionId: string | null;
  diagnosticSessionId: string | null;
  failedServerStep: string;
  finalServerStep: string;
  statusCode: number;
  statusMessage: string;
  errorName: string;
  errorMessage: string;
  durationMs: number;
  uploadedPhotoCount: number;
  activeTagId: string | null;
  submissionId: string | null;
  environment?: string | null;
  occurredAt?: Date;
};

export type SubmitFailureAlertResult =
  | "sent"
  | "failed"
  | "skipped_client_error"
  | "skipped_missing_config"
  | "skipped_non_production"
  | "skipped_rate_limited";

const defaultAlertAttempts = 1;
const defaultAlertWindowMs = 10 * 60 * 1000;

type GlobalWithProcess = typeof globalThis & {
  process?: {
    env?: Record<string, string | undefined>;
  };
};

const escapeHtml = (value: string) => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};

const getRuntimeEnvironment = (environment?: string | null) => {
  const runtimeProcess = (globalThis as GlobalWithProcess).process;

  return environment ?? runtimeProcess?.env?.VERCEL_ENV ?? null;
};

export const shouldSendSubmitFailureAlert = ({
  statusCode,
  environment,
}: {
  statusCode: number;
  environment?: string | null;
}) => {
  return getRuntimeEnvironment(environment) === "production" && statusCode >= 500;
};

const isRateLimitRejection = (error: unknown) => {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 429
  );
};

const hasAlertAllowance = async (failedServerStep: string) => {
  const runtimeConfig = useRuntimeConfig();
  const attempts = getPositiveNumberConfig(
    runtimeConfig.submitFailureAlertAttempts,
    defaultAlertAttempts,
  );
  const windowMs = getPositiveNumberConfig(
    runtimeConfig.submitFailureAlertWindowMs,
    defaultAlertWindowMs,
  );

  try {
    await assertRateLimit({
      key: `submit-failure-alert:${failedServerStep}`,
      limit: attempts,
      windowMs,
      messagePrefix: "Submit failure alert suppressed.",
    });

    return true;
  } catch (error) {
    if (isRateLimitRejection(error)) {
      return false;
    }

    // Fail open so a database or limiter outage can still trigger an alert.
    console.error("Submit failure alert rate limiter failed open.", error);
    return true;
  }
};

const getAlertText = (payload: SubmitFailureAlertPayload, occurredAt: string) => {
  return [
    "Bike Tag production submission failure",
    "",
    `Occurred: ${occurredAt}`,
    `Environment: ${getRuntimeEnvironment(payload.environment) ?? "unknown"}`,
    `Status: ${payload.statusCode} ${payload.statusMessage}`,
    `Failed step: ${payload.failedServerStep}`,
    `Final step: ${payload.finalServerStep}`,
    `Request ID: ${payload.requestId}`,
    `Client submission ID: ${payload.clientSubmissionId ?? "unavailable"}`,
    `Diagnostic session ID: ${payload.diagnosticSessionId ?? "unavailable"}`,
    `Submission ID: ${payload.submissionId ?? "not created"}`,
    `Active tag ID: ${payload.activeTagId ?? "unavailable"}`,
    `Duration: ${payload.durationMs} ms`,
    `Uploaded photos: ${payload.uploadedPhotoCount}`,
    `Error: ${payload.errorName}: ${payload.errorMessage}`,
    "",
    "Check the Vercel runtime logs and submit_diagnostic_events using the request or diagnostic session ID.",
  ].join("\n");
};

const getAlertHtml = (payload: SubmitFailureAlertPayload, occurredAt: string) => {
  const rows = [
    ["Occurred", occurredAt],
    ["Environment", getRuntimeEnvironment(payload.environment) ?? "unknown"],
    ["Status", `${payload.statusCode} ${payload.statusMessage}`],
    ["Failed step", payload.failedServerStep],
    ["Final step", payload.finalServerStep],
    ["Request ID", payload.requestId],
    ["Client submission ID", payload.clientSubmissionId ?? "unavailable"],
    ["Diagnostic session ID", payload.diagnosticSessionId ?? "unavailable"],
    ["Submission ID", payload.submissionId ?? "not created"],
    ["Active tag ID", payload.activeTagId ?? "unavailable"],
    ["Duration", `${payload.durationMs} ms`],
    ["Uploaded photos", String(payload.uploadedPhotoCount)],
    ["Error", `${payload.errorName}: ${payload.errorMessage}`],
  ];

  return `
    <!doctype html>
    <html>
      <body style="margin:0; padding:24px; background:#fff7ed; color:#172033; font-family:Arial, Helvetica, sans-serif;">
        <div style="max-width:720px; margin:0 auto; background:#ffffff; border:1px solid #fed7aa; border-radius:18px; padding:28px;">
          <p style="margin:0 0 8px; color:#c2410c; font-size:12px; font-weight:700; letter-spacing:.08em; text-transform:uppercase;">Bike Tag production alert</p>
          <h1 style="margin:0 0 18px; font-size:28px;">Submission request failed</h1>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
            ${rows
              .map(
                ([label, value]) => `
                  <tr>
                    <td style="border-top:1px solid #e5e7eb; padding:10px 12px; color:#6b7280; font-size:13px; font-weight:700; width:34%;">${escapeHtml(label)}</td>
                    <td style="border-top:1px solid #e5e7eb; padding:10px 12px; font-family:monospace; font-size:13px; overflow-wrap:anywhere;">${escapeHtml(value)}</td>
                  </tr>
                `,
              )
              .join("")}
          </table>
          <p style="margin:18px 0 0; color:#4b5563; line-height:1.6;">Check Vercel runtime logs and <code>submit_diagnostic_events</code> using the request or diagnostic session ID.</p>
        </div>
      </body>
    </html>
  `;
};

export const sendSubmitFailureAlert = async (
  payload: SubmitFailureAlertPayload,
): Promise<SubmitFailureAlertResult> => {
  if (
    !shouldSendSubmitFailureAlert({
      statusCode: payload.statusCode,
      environment: payload.environment,
    })
  ) {
    return payload.statusCode >= 500
      ? "skipped_non_production"
      : "skipped_client_error";
  }

  const runtimeConfig = useRuntimeConfig();
  const notificationConfig = resolveSubmissionNotificationConfig(
    {
      resendApiKey: runtimeConfig.resendApiKey,
      adminNotificationEmail: runtimeConfig.adminNotificationEmail,
      fromEmail: runtimeConfig.fromEmail,
      siteUrl: runtimeConfig.public.siteUrl,
    },
    {
      allowMissingNotificationConfig: true,
    },
  );

  if (!notificationConfig) {
    console.warn("Submit failure alert skipped. Missing email configuration.");
    return "skipped_missing_config";
  }

  if (!(await hasAlertAllowance(payload.failedServerStep))) {
    return "skipped_rate_limited";
  }

  const occurredAt = (payload.occurredAt ?? new Date()).toISOString();
  const resend = new Resend(notificationConfig.resendApiKey);

  await resend.emails.send({
    from: notificationConfig.fromEmail,
    to: notificationConfig.adminNotificationEmail,
    subject: `Bike Tag production submit failure: ${payload.failedServerStep}`,
    text: getAlertText(payload, occurredAt),
    html: getAlertHtml(payload, occurredAt),
  });

  return "sent";
};

export const safelySendSubmitFailureAlert = async (
  payload: SubmitFailureAlertPayload,
): Promise<SubmitFailureAlertResult> => {
  try {
    return await sendSubmitFailureAlert(payload);
  } catch (error) {
    console.error("Submit failure alert email failed.", error);
    return "failed";
  }
};
