import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  shareCurrentTag,
  type ShareCurrentTagOptions
} from '../../app/utils/shareCurrentTag'

const shareData: ShareCurrentTagOptions = {
  title: 'Louisville Bike Tag',
  text: 'Help find the current Bike Tag.',
  url: 'https://louisvillebiketag.vercel.app/current-tag'
}

const mockPointer = (matches: boolean) => {
  vi.stubGlobal('window', {
    matchMedia: vi.fn(() => {
      return {
        matches
      }
    })
  })
}

describe('shareCurrentTag', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('uses native share on touch style devices when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)

    mockPointer(true)

    vi.stubGlobal('navigator', {
      share,
      canShare: vi.fn(() => true),
      clipboard: {
        writeText
      }
    })

    await expect(shareCurrentTag(shareData)).resolves.toEqual({
      status: 'shared'
    })

    expect(share).toHaveBeenCalledWith(shareData)
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies only the link on desktop even when native share exists', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)

    mockPointer(false)

    vi.stubGlobal('navigator', {
      share,
      canShare: vi.fn(() => true),
      clipboard: {
        writeText
      }
    })

    await expect(shareCurrentTag(shareData)).resolves.toEqual({
      status: 'copied'
    })

    expect(share).not.toHaveBeenCalled()
    expect(writeText).toHaveBeenCalledWith(shareData.url)
  })

  it('copies the link when native share is unavailable', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)

    mockPointer(true)

    vi.stubGlobal('navigator', {
      clipboard: {
        writeText
      }
    })

    await expect(shareCurrentTag(shareData)).resolves.toEqual({
      status: 'copied'
    })

    expect(writeText).toHaveBeenCalledWith(shareData.url)
  })

  it('copies the link when native share cannot share the data', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    const writeText = vi.fn().mockResolvedValue(undefined)

    mockPointer(true)

    vi.stubGlobal('navigator', {
      share,
      canShare: vi.fn(() => false),
      clipboard: {
        writeText
      }
    })

    await expect(shareCurrentTag(shareData)).resolves.toEqual({
      status: 'copied'
    })

    expect(share).not.toHaveBeenCalled()
    expect(writeText).toHaveBeenCalledWith(shareData.url)
  })

  it('returns unsupported when share and clipboard are unavailable', async () => {
    mockPointer(false)

    vi.stubGlobal('navigator', {})

    await expect(shareCurrentTag(shareData)).resolves.toEqual({
      status: 'unsupported'
    })
  })
})