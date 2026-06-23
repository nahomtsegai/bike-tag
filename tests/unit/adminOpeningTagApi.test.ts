import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createAdminOpeningTag } from '../../app/utils/adminOpeningTagApi'

const fetchMock = vi.hoisted(() => vi.fn())

vi.stubGlobal('$fetch', fetchMock)

describe('adminOpeningTagApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    fetchMock.mockResolvedValue({
      success: true,
      message: 'Opening tag created.',
      currentTag: {
        id: '123e4567-e89b-42d3-a456-426614174000',
        title: 'Opening tag',
        imageUrl: 'https://example.com/opening.jpg',
        foundBy: 'Admin',
        createdAt: '06/23/2026',
        createdAtIso: '2026-06-23T12:00:00.000Z',
        status: 'active',
        clueIsUnlocked: false,
        clueUnlocksAtIso: '2026-06-28T12:00:00.000Z'
      }
    })
  })

  it('uses JSON when a photo URL is supplied', async () => {
    await createAdminOpeningTag({
      title: 'Opening tag',
      clue: 'Opening clue',
      imageUrl: 'https://example.com/opening.jpg',
      hiddenLocationMapUrl: 'https://maps.google.com/example'
    })

    expect(fetchMock).toHaveBeenCalledWith('/api/admin/tags/opening', {
      method: 'POST',
      body: {
        title: 'Opening tag',
        clue: 'Opening clue',
        imageUrl: 'https://example.com/opening.jpg',
        hiddenLocationMapUrl: 'https://maps.google.com/example'
      }
    })
  })

  it('uses multipart form data when an opening tag photo is supplied', async () => {
    const photoFile = new File(['photo'], 'opening.jpg', {
      type: 'image/jpeg'
    })

    await createAdminOpeningTag({
      title: 'Opening tag',
      clue: 'Opening clue',
      imageUrl: '',
      hiddenLocationMapUrl: 'https://maps.google.com/example',
      photoFile
    })

    const request = fetchMock.mock.calls[0]?.[1]
    expect(request?.method).toBe('POST')
    expect(request?.body).toBeInstanceOf(FormData)

    const body = request?.body as FormData
    expect(body.get('title')).toBe('Opening tag')
    expect(body.get('imageUrl')).toBe('')
    expect(body.get('photo')).toBe(photoFile)
  })
})
