const clueUnlockDelayInDays = 5
const millisecondsPerDay = 24 * 60 * 60 * 1000

export const createClueUnlockDate = (createdAtIso: string) => {
  const createdAtTime = new Date(createdAtIso).getTime()
  const clueUnlockTime = createdAtTime + clueUnlockDelayInDays * millisecondsPerDay

  return new Date(clueUnlockTime)
}

export const getClueVisibility = (createdAtIso: string) => {
  const clueUnlockDate = createClueUnlockDate(createdAtIso)
  const now = new Date()

  return {
    clueIsUnlocked: now >= clueUnlockDate,
    clueUnlocksAtIso: clueUnlockDate.toISOString()
  }
}