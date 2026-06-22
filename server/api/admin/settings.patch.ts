import { isValidClueUnlockDelayDays } from '~~/shared/utils/clueUnlock'
import { runAdminAuditedAction } from '../../utils/adminAudit'
import { assertAdminRequestAccess } from '../../utils/adminAuth'
import {
  getSupabaseGameSettings,
  updateSupabaseGameSettings
} from '../../utils/supabaseGameSettings'

type UpdateGameSettingsRequestBody = {
  clueUnlockDelayDays?: unknown
}

export default defineEventHandler(async (event) => {
  const { adminUser } = await assertAdminRequestAccess(event)
  const body = await readBody<UpdateGameSettingsRequestBody>(event)

  if (!isValidClueUnlockDelayDays(body.clueUnlockDelayDays)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Clue reveal delay must be a whole number from 0 to 30 days.'
    })
  }

  const currentSettings = await getSupabaseGameSettings()
  const settings = await runAdminAuditedAction({
    event,
    action: 'game_settings.update',
    actor: adminUser,
    targetType: 'game_settings',
    targetId: 'default',
    metadata: {
      previousClueUnlockDelayDays: currentSettings.clueUnlockDelayDays,
      clueUnlockDelayDays: body.clueUnlockDelayDays
    },
    execute: () =>
      updateSupabaseGameSettings({
        clueUnlockDelayDays: body.clueUnlockDelayDays
      })
  })

  return {
    success: true,
    message: 'Clue reveal delay updated.',
    settings
  }
})
