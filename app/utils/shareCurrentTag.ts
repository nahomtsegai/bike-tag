export type ShareCurrentTagOptions = {
  title: string
  text: string
  url: string
}

export type ShareCurrentTagResult =
  | {
      status: 'shared'
    }
  | {
      status: 'copied'
    }
  | {
      status: 'unsupported'
    }

const isLikelyMobileDevice = () => {
  if (typeof window === 'undefined') {
    return false
  }

  if (typeof window.matchMedia !== 'function') {
    return false
  }

  return window.matchMedia('(pointer: coarse)').matches
}

const canUseNativeShare = (shareData: ShareCurrentTagOptions) => {
  if (!isLikelyMobileDevice()) {
    return false
  }

  if (typeof navigator === 'undefined') {
    return false
  }

  if (typeof navigator.share !== 'function') {
    return false
  }

  if (typeof navigator.canShare !== 'function') {
    return true
  }

  return navigator.canShare(shareData)
}

const canUseClipboard = () => {
  return Boolean(
    typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof navigator.clipboard.writeText === 'function'
  )
}

export const shareCurrentTag = async (
  shareData: ShareCurrentTagOptions
): Promise<ShareCurrentTagResult> => {
  if (canUseNativeShare(shareData)) {
    await navigator.share(shareData)

    return {
      status: 'shared'
    }
  }

  if (canUseClipboard()) {
    await navigator.clipboard.writeText(shareData.url)

    return {
      status: 'copied'
    }
  }

  return {
    status: 'unsupported'
  }
}