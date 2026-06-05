import { assertAdminAccess } from '../../../utils/adminAuth'
import { createSupabaseServerClient } from '../../../utils/supabase'

type DeleteGameDataRequestBody = {
  confirmation?: string
}

const requiredConfirmationText = 'DELETE GAME DATA'

const getConfirmation = async (event: Parameters<typeof readBody>[0]) => {
  const body = await readBody<DeleteGameDataRequestBody>(event)

  if (body.confirmation !== requiredConfirmationText) {
    throw createError({
      statusCode: 400,
      statusMessage: `Type ${requiredConfirmationText} to confirm.`
    })
  }
}

const deleteRowsFromTable = async (tableName: 'submissions' | 'tags') => {
  const supabase = createSupabaseServerClient()

  const { count, error } = await supabase
    .from(tableName)
    .delete({
      count: 'exact'
    })
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not delete ${tableName}: ${error.message}`
    })
  }

  return count ?? 0
}

export default defineEventHandler(async (event) => {
  assertAdminAccess(event)
  await getConfirmation(event)

  const deletedSubmissionCount = await deleteRowsFromTable('submissions')
  const deletedTagCount = await deleteRowsFromTable('tags')

  return {
    success: true,
    message: 'Game data deleted.',
    deletedSubmissionCount,
    deletedTagCount
  }
})