import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTagApi } from '../../app/composables/useTagApi'
import { expectedActiveTagIdHeaderName } from '../../shared/utils/submitActiveTag'

const fetchMock = vi.fn()
const useNuxtDataMock = vi.fn()

describe('useTagApi', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    useNuxtDataMock.mockReset()
    vi.stubGlobal('$fetch', fetchMock)
    vi.stubGlobal('useNuxtData', useNuxtDataMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the page-loaded active tag id with a submission', async () => {
    useNuxtDataMock.mockReturnValue({
      data: {
        value: {
          currentTag: {
            id: '22222222-2222-4222-8222-222222222222'
          }
        }
      }
    })
    fetchMock.mockResolvedValueOnce({
      success: true,
      message: 'Submission received.',
      currentTag: {},
      submissionId: 'submission-123',
      status: 'pending'
    })

    const { submitTag } = useTagApi()
    const formData = new FormData()

    await submitTag(formData)

    expect(useNuxtDataMock).toHaveBeenCalledWith('submit-current-tag')
    expect(formData.get('expectedActiveTagId')).toBe(
      '22222222-2222-4222-8222-222222222222'
    )
    expect(fetchMock).toHaveBeenCalledWith('/api/tags/submit', {
      method: 'POST',
      body: formData,
      headers: {
        [expectedActiveTagIdHeaderName]:
          '22222222-2222-4222-8222-222222222222'
      }
    })
  })

  it('blocks an unbound submission when the loaded tag id is unavailable', async () => {
    useNuxtDataMock.mockReturnValue({
      data: {
        value: {
          currentTag: null
        }
      }
    })

    const { submitTag } = useTagApi()

    await expect(submitTag(new FormData())).rejects.toMatchObject({
      statusCode: 409,
      statusMessage:
        'The current Bike Tag could not be confirmed. Refresh the page before submitting.'
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })
})
