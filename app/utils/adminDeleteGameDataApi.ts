export type DeleteAdminGameDataInput = {
  confirmation: string
}

export type DeleteAdminGameDataResponse = {
  success: boolean
  message: string
  deletedSubmissionCount: number
  deletedTagCount: number
}

export const deleteAdminGameData = async ({
  confirmation
}: DeleteAdminGameDataInput) => {
  return await $fetch<DeleteAdminGameDataResponse>(
    '/api/admin/cleanup/delete-game-data',
    {
      method: 'POST',
      body: {
        confirmation
      }
    }
  )
}