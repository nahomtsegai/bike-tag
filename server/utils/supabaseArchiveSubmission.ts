import { createError } from 'h3'

import { createSupabaseServerClient } from './supabase'

type ArchiveSubmissionInput = {
  submissionId: string
}

type SubmissionForArchive = {
  id: string
  status: string
  archived_at: string | null
}

const isSubmissionForArchive = (
  value: unknown
): value is SubmissionForArchive => {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    typeof value.id === 'string' &&
    'status' in value &&
    typeof value.status === 'string' &&
    'archived_at' in value &&
    (typeof value.archived_at === 'string' || value.archived_at === null)
  )
}

const createArchiveSubmissionError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

const loadSubmissionForArchive = async (submissionId: string) => {
  const supabase = createSupabaseServerClient()

  const { data, error } = await supabase
    .from('submissions')
    .select('id,status,archived_at')
    .eq('id', submissionId)
    .maybeSingle()

  if (error) {
    throw createArchiveSubmissionError(
      `Could not load submission before archive: ${error.message}`
    )
  }

  if (!data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Submission was not found.'
    })
  }

  if (!isSubmissionForArchive(data)) {
    throw createArchiveSubmissionError(
      'Submission returned an unexpected response.'
    )
  }

  return data
}

const archiveSubmissionRow = async (submissionId: string) => {
  const supabase = createSupabaseServerClient()
  const archivedAt = new Date().toISOString()

  const { data, error } = await supabase
    .from('submissions')
    .update({
      archived_at: archivedAt
    })
    .eq('id', submissionId)
    .eq('status', 'approved')
    .is('archived_at', null)
    .select('id,archived_at')
    .maybeSingle()

  if (error) {
    throw createArchiveSubmissionError(
      `Could not archive submission in Supabase: ${error.message}`
    )
  }

  if (!data) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Approved submission could not be archived.'
    })
  }

  return {
    submissionId: data.id,
    archivedAt: data.archived_at
  }
}

export const archiveApprovedSubmissionInSupabase = async ({
  submissionId
}: ArchiveSubmissionInput) => {
  const submission = await loadSubmissionForArchive(submissionId)

  if (submission.status !== 'approved') {
    throw createError({
      statusCode: 409,
      statusMessage: 'Only approved submissions can be archived.'
    })
  }

  if (submission.archived_at) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Submission is already archived.'
    })
  }

  return archiveSubmissionRow(submissionId)
}