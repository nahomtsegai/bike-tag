import { createError } from 'h3'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const isValidUuid = (value: string) => {
  return uuidPattern.test(value)
}

export const assertValidUuid = (value: string, fieldName: string) => {
  if (!isValidUuid(value)) {
    throw createError({
      statusCode: 400,
      statusMessage: `${fieldName} must be a valid UUID.`
    })
  }
}