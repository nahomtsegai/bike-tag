import { createSupabaseServerClient } from './supabase'

export type GameSettings = {
  clueUnlockDelayDays: number
  updatedAtIso: string
}

type GameSettingsRow = {
  clue_unlock_delay_days: number
  updated_at: string
}

const gameSettingsSelectColumns = 'clue_unlock_delay_days, updated_at'

const mapGameSettingsRow = (settings: GameSettingsRow): GameSettings => {
  return {
    clueUnlockDelayDays: settings.clue_unlock_delay_days,
    updatedAtIso: settings.updated_at
  }
}

const createGameSettingsError = (message: string) => {
  return createError({
    statusCode: 500,
    statusMessage: message
  })
}

export const getSupabaseGameSettings = async () => {
  const supabase = createSupabaseServerClient()
  const { data, error } = await supabase
    .from('game_settings')
    .select(gameSettingsSelectColumns)
    .eq('id', true)
    .single()
    .overrideTypes<GameSettingsRow, { merge: false }>()

  if (error) {
    throw createGameSettingsError(
      `Could not load game settings from Supabase: ${error.message}`
    )
  }

  return mapGameSettingsRow(data)
}

export const updateSupabaseGameSettings = async ({
  clueUnlockDelayDays
}: {
  clueUnlockDelayDays: number
}) => {
  const supabase = createSupabaseServerClient()
  const updatedAtIso = new Date().toISOString()
  const { data, error } = await supabase
    .from('game_settings')
    .update({
      clue_unlock_delay_days: clueUnlockDelayDays,
      updated_at: updatedAtIso
    })
    .eq('id', true)
    .select(gameSettingsSelectColumns)
    .single()
    .overrideTypes<GameSettingsRow, { merge: false }>()

  if (error) {
    throw createGameSettingsError(
      `Could not update game settings in Supabase: ${error.message}`
    )
  }

  return mapGameSettingsRow(data)
}
