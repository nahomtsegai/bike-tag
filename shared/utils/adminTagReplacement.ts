export const adminTagReplacementConfirmationText = 'REPLACE CURRENT TAG'

export const adminTagReplacementSupersededReason =
  'The current tag was replaced by an administrator.'

export const isAdminTagReplacementConfirmed = (value: unknown) => {
  return typeof value === 'string' && value.trim() === adminTagReplacementConfirmationText
}
