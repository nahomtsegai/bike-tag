import { assertAdminRequestAccess } from '../../utils/adminAuth'
import { getSupabaseGameSettings } from '../../utils/supabaseGameSettings'

export default defineEventHandler(async (event) => {
  await assertAdminRequestAccess(event)

  return {
    settings: await getSupabaseGameSettings()
  }
})
