const copyTextWithFallback = (text: string) => {
  if (typeof document === 'undefined' || !document.body) {
    throw new Error('Clipboard access is unavailable.')
  }

  const textarea = document.createElement('textarea')

  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'
  textarea.style.left = '-9999px'

  document.body.appendChild(textarea)

  try {
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)

    if (
      typeof document.execCommand !== 'function' ||
      !document.execCommand('copy')
    ) {
      throw new Error('Fallback copy failed.')
    }
  } finally {
    document.body.removeChild(textarea)
  }
}

export const copyTextToClipboard = async (text: string) => {
  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.clipboard?.writeText === 'function' &&
    (typeof window === 'undefined' || window.isSecureContext)
  ) {
    await navigator.clipboard.writeText(text)
    return
  }

  copyTextWithFallback(text)
}
