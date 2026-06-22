import { assertAdminRequestAccess } from '../../../utils/adminAuth'
import { getAdminCurrentTagState } from '../../../utils/supabaseReplaceCurrentTag'
import { createCurrentTagResponse } from '../../../utils/tagResponse'

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)
  const state = await getAdminCurrentTagState()

  return {
    success: true,
    currentTag: state.currentTag ? createCurrentTagResponse(state.currentTag) : null,
    pendingSubmissionCount: state.pendingSubmissionCount
  }
})
