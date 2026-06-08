import { Resend } from 'resend'

type SubmissionNotificationPayload = {
  submissionId?: string | null
  riderName: string
  nextTitle: string
  foundLocationMapUrl: string
  nextHiddenLocationMapUrl: string
}

const escapeHtml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

const getAdminSubmissionUrl = (siteUrl: string, submissionId?: string | null) => {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '')

  if (!submissionId) {
    return `${normalizedSiteUrl}/admin/submissions`
  }

  return `${normalizedSiteUrl}/admin/submissions?submission=${submissionId}`
}

const getNotificationText = ({
  submissionId,
  riderName,
  nextTitle,
  adminSubmissionUrl,
  foundLocationMapUrl,
  nextHiddenLocationMapUrl
}: {
  submissionId?: string | null
  riderName: string
  nextTitle: string
  adminSubmissionUrl: string
  foundLocationMapUrl: string
  nextHiddenLocationMapUrl: string
}) => {
  return [
    'New Bike Tag submission',
    '',
    'A new submission is ready for admin review.',
    '',
    `Rider: ${riderName}`,
    `Next tag: ${nextTitle}`,
    submissionId ? `Submission ID: ${submissionId}` : null,
    '',
    `Review submission: ${adminSubmissionUrl}`,
    '',
    'Locations:',
    `Match location: ${foundLocationMapUrl}`,
    `Hidden next location: ${nextHiddenLocationMapUrl}`,
    '',
    'The current tag stays active until this submission is approved.'
  ]
    .filter(Boolean)
    .join('\n')
}

const getNotificationHtml = ({
  submissionId,
  riderName,
  nextTitle,
  adminSubmissionUrl,
  foundLocationMapUrl,
  nextHiddenLocationMapUrl
}: {
  submissionId?: string | null
  riderName: string
  nextTitle: string
  adminSubmissionUrl: string
  foundLocationMapUrl: string
  nextHiddenLocationMapUrl: string
}) => {
  const safeRiderName = escapeHtml(riderName)
  const safeNextTitle = escapeHtml(nextTitle)
  const safeSubmissionId = submissionId ? escapeHtml(submissionId) : null
  const safeAdminSubmissionUrl = escapeHtml(adminSubmissionUrl)
  const safeFoundLocationMapUrl = escapeHtml(foundLocationMapUrl)
  const safeNextHiddenLocationMapUrl = escapeHtml(nextHiddenLocationMapUrl)

  return `
    <!doctype html>
    <html>
      <body style="margin:0; padding:0; background:#f6f7f4; color:#162033; font-family:Arial, Helvetica, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f4; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #dfe5dc; border-radius:20px; overflow:hidden;">
                <tr>
                  <td style="padding:28px 28px 16px;">
                    <p style="margin:0 0 10px; color:#0f766e; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                      Bike Tag Admin
                    </p>

                    <h1 style="margin:0; color:#162033; font-size:32px; line-height:1.12;">
                      New submission ready for review
                    </h1>

                    <p style="margin:16px 0 0; color:#4b5563; font-size:16px; line-height:1.6;">
                      A rider submitted a find and created the next mystery spot. Review it before the current tag changes.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 28px 8px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
                      <tr>
                        <td style="padding:14px 16px; background:#f9fafb; color:#6b7280; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; width:34%;">
                          Rider
                        </td>
                        <td style="padding:14px 16px; color:#162033; font-size:15px; font-weight:700;">
                          ${safeRiderName}
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:14px 16px; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                          Next tag
                        </td>
                        <td style="padding:14px 16px; border-top:1px solid #e5e7eb; color:#162033; font-size:15px; font-weight:700;">
                          ${safeNextTitle}
                        </td>
                      </tr>

                      ${
                        safeSubmissionId
                          ? `
                            <tr>
                              <td style="padding:14px 16px; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                                Submission ID
                              </td>
                              <td style="padding:14px 16px; border-top:1px solid #e5e7eb; color:#162033; font-size:15px; font-family:monospace;">
                                ${safeSubmissionId}
                              </td>
                            </tr>
                          `
                          : ''
                      }
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 28px 8px;">
                    <a
                      href="${safeAdminSubmissionUrl}"
                      style="display:inline-block; background:#0f172a; color:#ffffff; border-radius:999px; font-size:16px; font-weight:700; padding:14px 22px; text-decoration:none;"
                    >
                      Review submission
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 28px 8px;">
                    <h2 style="margin:0 0 12px; color:#162033; font-size:18px;">
                      Location links
                    </h2>

                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border:1px solid #e5e7eb; border-radius:14px; overflow:hidden;">
                      <tr>
                        <td style="padding:14px 16px; background:#f9fafb; color:#6b7280; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; width:34%;">
                          Match
                        </td>
                        <td style="padding:14px 16px; color:#162033; font-size:15px; overflow-wrap:anywhere;">
                          <a href="${safeFoundLocationMapUrl}" style="color:#0f766e; font-weight:700;">
                            Open match location
                          </a>
                        </td>
                      </tr>

                      <tr>
                        <td style="padding:14px 16px; background:#f9fafb; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">
                          Hidden next
                        </td>
                        <td style="padding:14px 16px; border-top:1px solid #e5e7eb; color:#162033; font-size:15px; overflow-wrap:anywhere;">
                          <a href="${safeNextHiddenLocationMapUrl}" style="color:#0f766e; font-weight:700;">
                            Open hidden next location
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 28px 28px;">
                    <p style="margin:0; background:#ecfdf5; border:1px solid #bbf7d0; border-radius:14px; color:#166534; font-size:14px; font-weight:700; line-height:1.6; padding:14px 16px;">
                      The current tag stays active until this submission is approved.
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:18px 0 0; color:#6b7280; font-size:12px; line-height:1.5;">
                Sent by Louisville Bike Tag.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `
}

export const sendSubmissionNotification = async ({
  submissionId,
  riderName,
  nextTitle,
  foundLocationMapUrl,
  nextHiddenLocationMapUrl
}: SubmissionNotificationPayload) => {
  const runtimeConfig = useRuntimeConfig()

  const resendApiKey = runtimeConfig.resendApiKey
  const adminNotificationEmail = runtimeConfig.adminNotificationEmail
  const fromEmail = runtimeConfig.fromEmail
  const siteUrl = runtimeConfig.public.siteUrl

  if (!resendApiKey || !adminNotificationEmail || !fromEmail || !siteUrl) {
    console.warn('Submission notification email skipped. Missing config.')

    return
  }

  const resend = new Resend(resendApiKey)
  const adminSubmissionUrl = getAdminSubmissionUrl(siteUrl, submissionId)

  await resend.emails.send({
    from: fromEmail,
    to: adminNotificationEmail,
    subject: `New Bike Tag submission: ${nextTitle}`,
    text: getNotificationText({
      submissionId,
      riderName,
      nextTitle,
      adminSubmissionUrl,
      foundLocationMapUrl,
      nextHiddenLocationMapUrl
    }),
    html: getNotificationHtml({
      submissionId,
      riderName,
      nextTitle,
      adminSubmissionUrl,
      foundLocationMapUrl,
      nextHiddenLocationMapUrl
    })
  })
}