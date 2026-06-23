import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getAdminCurrentTagState,
  replaceAdminCurrentTag
} from '../../app/utils/adminCurrentTagApi'

const fetchMock = vi.hoisted(() => vi.fn())

vi.stubGlobal('$fetch', fetchMock)

const currentTag = {
  id: '123e4567-e89b-42d3-a456-426614174000',
  title: 'Current tag',
  imageUrl: 'https://example.com/current.jpg',
  foundBy: 'Admin',
  createdAt: '06/22/2026',
  createdAtIso: '2026-06-22T20:00:00.000Z',
  status: 'active' as const,
  clueIsUnlocked: false,
  clueUnlocksAtIso: '2026-06-27T20:00:00.000Z'
}

describe('adminCurrentTagApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the current tag and pending submission count', async () => {
    fetchMock.mockResolvedValueOnce({
      success: true,
      currentTag,
      pendingSubmissionCount: 2
    })

    await expect(getAdminCurrentTagState()).resolves.toEqual({
      success: true,
      currentTag,
      pendingSubmissionCount: 2
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/tags/current')
  })

  it('replaces the current tag with the supplied confirmation', async () => {
    fetchMock.mockResolvedValueOnce({
      success: true,
      message: 'Current tag replaced.',
      replacedTagId: currentTag.id,
      supersededSubmissionCount: 2,
      currentTag: {
        ...currentTag,
        id: '223e4567-e89b-42d3-a456-426614174000',
        title: 'Replacement tag'
      }
    })

    await replaceAdminCurrentTag({
      title: 'Replacement tag',
      clue: 'Replacement clue',
      imageUrl: 'https://example.com/replacement.jpg',
      hiddenLocationMapUrl: 'https://maps.google.com/example',
      confirmation: 'REPLACE CURRENT TAG'
    })

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/tags/current/replace',
      {
        method: 'POST',
        body: {
          title: 'Replacement tag',
          clue: 'Replacement clue',
          imageUrl: 'https://example.com/replacement.jpg',
          hiddenLocationMapUrl: 'https://maps.google.com/example',
          confirmation: 'REPLACE CURRENT TAG'
        }
      }
    )
  })

  it('surfaces the server status message', async () => {
    fetchMock.mockRejectedValueOnce({
      data: {
        statusMessage: 'There is no active Bike Tag to replace.'
      }
    })

    await expect(
      replaceAdminCurrentTag({
        title: 'Replacement tag',
        clue: 'Replacement clue',
        imageUrl: 'https://example.com/replacement.jpg',
        hiddenLocationMapUrl: 'https://maps.google.com/example',
        confirmation: 'REPLACE CURRENT TAG'
      })
    ).rejects.toThrow('There is no active Bike Tag to replace.')
  })
})
