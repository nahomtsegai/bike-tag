import { createError, defineEventHandler, getRouterParam } from 'h3'

import { createSupabaseServerClient } from '~~/server/utils/supabase'
import { getPublicSubmissionStatus } from '~~/server/utils/supabaseSubmissionStatus'

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const submissionId = getRouterParam(event, 'id')?.trim()

  if (!submissionId || !uuidPattern.test(submissionId)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Enter a valid submission reference code.'
    })
  }

  const supabase = createSupabaseServerClient()

  const submissionStatus = await getPublicSubmissionStatus(
    supabase,
    submissionId
  )

  if (!submissionStatus) {
    throw createError({
      statusCode: 404,
      statusMessage: 'No submission was found for that reference code.'
    })
  }

  return submissionStatus
})