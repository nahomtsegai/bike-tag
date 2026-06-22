export const defaultClueUnlockDelayDays = 5
export const minimumClueUnlockDelayDays = 0
export const maximumClueUnlockDelayDays = 30

const millisecondsPerDay = 24 * 60 * 60 * 1000

export const isValidClueUnlockDelayDays = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value) && value >= minimumClueUnlockDelayDays && value <= maximumClueUnlockDelayDays
}

export const createClueUnlocksAtIso = ({ createdAtIso, delayDays = defaultClueUnlockDelayDays }: { createdAtIso: string; delayDays?: number }) => {
  if (!isValidClueUnlockDelayDays(delayDays)) {
    throw new Error('Clue unlock delay must be a whole number from 0 to 30.')
  }

  const createdAtTime = new Date(createdAtIso).getTime()

  if (!Number.isFinite(createdAtTime)) {
    throw new Error('Created date must be valid.')
  }

  return new Date(createdAtTime + delayDays * millisecondsPerDay).toISOString()
}

export const resolveClueUnlocksAtIso = ({ createdAtIso, clueUnlocksAtIso }: { createdAtIso: string; clueUnlocksAtIso?: string }) => {
  if (clueUnlocksAtIso) {
    const clueUnlockTime = new Date(clueUnlocksAtIso).getTime()

    if (Number.isFinite(clueUnlockTime)) {
      return new Date(clueUnlockTime).toISOString()
    }
  }

  return createClueUnlocksAtIso({ createdAtIso })
}
