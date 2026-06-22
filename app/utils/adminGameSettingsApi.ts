export type AdminGameSettings = {
  clueUnlockDelayDays: number
  updatedAtIso: string
}

export type AdminGameSettingsResponse = {
  settings: AdminGameSettings
}

export type UpdateAdminGameSettingsResponse = AdminGameSettingsResponse & {
  success: boolean
  message: string
}

export const getAdminGameSettings = async () => {
  return await $fetch<AdminGameSettingsResponse>('/api/admin/settings')
}

export const updateAdminGameSettings = async ({
  clueUnlockDelayDays
}: {
  clueUnlockDelayDays: number
}) => {
  return await $fetch<UpdateAdminGameSettingsResponse>('/api/admin/settings', {
    method: 'PATCH',
    body: {
      clueUnlockDelayDays
    }
  })
}
