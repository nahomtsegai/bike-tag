import { resolveClueUnlocksAtIso } from '~~/shared/utils/clueUnlock'

export const createClueUnlockDate = (
  createdAtIso: string,
  clueUnlocksAtIso?: string
) => {
  return new Date(
    resolveClueUnlocksAtIso({
      createdAtIso,
      clueUnlocksAtIso
    })
  )
}

export const getClueVisibility = (
  createdAtIso: string,
  clueUnlocksAtIso?: string,
  now = new Date()
) => {
  const clueUnlockDate = createClueUnlockDate(
    createdAtIso,
    clueUnlocksAtIso
  )

  return {
    clueIsUnlocked: now >= clueUnlockDate,
    clueUnlocksAtIso: clueUnlockDate.toISOString()
  }
}
