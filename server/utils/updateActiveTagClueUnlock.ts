import { createSupabaseServerClient } from './supabase'

const millisecondsPerDay = 24 * 60 * 60 * 1000

export const updateActiveTagClueUnlock = async (
  clueUnlockDelayDays: number
) => {
  const supabase = createSupabaseServerClient()
  const { data: activeTag, error: loadError } = await supabase
    .from('tags')
    .select('id, created_at')
    .eq('status', 'active')
    .maybeSingle()

  if (loadError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not load the active tag: ${loadError.message}`
    })
  }

  if (!activeTag) {
    return null
  }

  const clueUnlocksAtIso = new Date(
    new Date(activeTag.created_at).getTime() +
      clueUnlockDelayDays * millisecondsPerDay
  ).toISOString()

  const { error: updateError } = await supabase
    .from('tags')
    .update({ clue_unlocks_at: clueUnlocksAtIso })
    .eq('id', activeTag.id)
    .eq('status', 'active')

  if (updateError) {
    throw createError({
      statusCode: 500,
      statusMessage: `Could not update the active tag clue unlock time: ${updateError.message}`
    })
  }

  return clueUnlocksAtIso
}
