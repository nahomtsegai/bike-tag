import { Resend } from 'resend'

type SubmissionNotificationPayload = {
  submissionId?: string | null
  riderName: string
  nextTitle: string
  foundLocationMapUrl: string
  nextHiddenLocationMapUrl: string
}

const getAdminSubmissionUrl = (siteUrl: string, submissionId?: string | null) => {
  const normalizedSiteUrl = siteUrl.replace(/\/$/, '')

  if (!submissionId) {
    return `${normalizedSiteUrl}/admin/submissions`
  }

  return `${normalizedSiteUrl}/admin/submissions?submission=${submissionId}`
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
    subject: `New Bike Tag submission from ${riderName}`,
    text: [
      'A new Bike Tag submission is ready for review.',
      '',
      `Rider: ${riderName}`,
      `Next tag: ${nextTitle}`,
      submissionId ? `Submission ID: ${submissionId}` : null,
      '',
      `Review submissions: ${adminSubmissionUrl}`,
      '',
      `Found location: ${foundLocationMapUrl}`,
      `Next hidden location: ${nextHiddenLocationMapUrl}`
    ]
      .filter(Boolean)
      .join('\n')
  })
}