import { beforeEach, describe, expect, it, vi } from 'vitest'
import { copyTextToClipboard } from '../../app/utils/copyTextToClipboard'

type FakeTextarea = {
  value: string
  style: Record<string, string>
  setAttribute: ReturnType<typeof vi.fn>
  select: ReturnType<typeof vi.fn>
  setSelectionRange: ReturnType<typeof vi.fn>
}

const createFakeTextarea = (): FakeTextarea => {
  return {
    value: '',
    style: {},
    setAttribute: vi.fn(),
    select: vi.fn(),
    setSelectionRange: vi.fn()
  }
}

describe('copyTextToClipboard', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses the Clipboard API in a secure context', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    vi.stubGlobal('window', {
      isSecureContext: true
    })
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText
      }
    })

    await copyTextToClipboard('{"status":"failed"}')

    expect(writeText).toHaveBeenCalledWith('{"status":"failed"}')
  })

  it('uses the textarea fallback when the Clipboard API is unavailable', async () => {
    const textarea = createFakeTextarea()
    const appendChild = vi.fn()
    const removeChild = vi.fn()
    const execCommand = vi.fn(() => true)

    vi.stubGlobal('window', {
      isSecureContext: false
    })
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('document', {
      body: {
        appendChild,
        removeChild
      },
      createElement: vi.fn(() => textarea),
      execCommand
    })

    await copyTextToClipboard('diagnostic metadata')

    expect(textarea.value).toBe('diagnostic metadata')
    expect(textarea.setAttribute).toHaveBeenCalledWith('readonly', '')
    expect(textarea.select).toHaveBeenCalled()
    expect(textarea.setSelectionRange).toHaveBeenCalledWith(
      0,
      'diagnostic metadata'.length
    )
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(appendChild).toHaveBeenCalledWith(textarea)
    expect(removeChild).toHaveBeenCalledWith(textarea)
  })

  it('removes the fallback textarea when copying fails', async () => {
    const textarea = createFakeTextarea()
    const removeChild = vi.fn()

    vi.stubGlobal('window', {
      isSecureContext: false
    })
    vi.stubGlobal('navigator', {})
    vi.stubGlobal('document', {
      body: {
        appendChild: vi.fn(),
        removeChild
      },
      createElement: vi.fn(() => textarea),
      execCommand: vi.fn(() => false)
    })

    await expect(copyTextToClipboard('diagnostic metadata')).rejects.toThrow(
      'Fallback copy failed.'
    )

    expect(removeChild).toHaveBeenCalledWith(textarea)
  })
})
