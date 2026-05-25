import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { maxImageFileSizeInBytes } from '~~/shared/utils/imageValidation'
import { parseSubmitFormData } from '../../server/utils/submitFormData'

type CreateErrorInput = {
  statusCode: number
  statusMessage: string
}

const createTestError = ({ statusCode, statusMessage }: CreateErrorInput) => {
  const error = new Error(statusMessage) as Error & CreateErrorInput

  error.statusCode = statusCode
  error.statusMessage = statusMessage

  return error
}

const createImageFile = ({
  name = 'photo.jpg',
  type = 'image/jpeg',
  contents = ['test photo content']
}: {
  name?: string
  type?: string
  contents?: BlobPart[]
} = {}) => {
  return new File(contents, name, { type })
}

const createValidSubmitFormData = () => {
  const formData = new FormData()

  formData.append('riderName', '  Test Rider  ')
  formData.append(
    'foundLocationMapUrl',
    '  https://www.google.com/maps/place/Louisville  '
  )
  formData.append('nextTitle', '  Smoke Test Tag  ')
  formData.append('nextClue', '  Look near the bike rack.  ')
  formData.append(
    'nextHiddenLocationMapUrl',
    '  https://maps.google.com/maps?q=Louisville  '
  )
  formData.append('matchPhoto', createImageFile({ name: 'match.jpg' }))
  formData.append('nextPhoto', createImageFile({ name: 'next.webp', type: 'image/webp' }))

  return formData
}

describe('submitFormData', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('parseSubmitFormData', () => {
    it('parses a valid submit form payload', async () => {
      const result = await parseSubmitFormData(createValidSubmitFormData())

      expect(result).toEqual({
        riderName: 'Test Rider',
        foundLocationMapUrl: 'https://www.google.com/maps/place/Louisville',
        nextTitle: 'Smoke Test Tag',
        nextClue: 'Look near the bike rack.',
        nextHiddenLocationMapUrl: 'https://maps.google.com/maps?q=Louisville',
        matchPhoto: {
          fileName: 'match.jpg',
          mimeType: 'image/jpeg',
          fileBuffer: expect.any(Uint8Array)
        },
        nextPhoto: {
          fileName: 'next.webp',
          mimeType: 'image/webp',
          fileBuffer: expect.any(Uint8Array)
        }
      })

      expect(result.matchPhoto.fileBuffer.byteLength).toBeGreaterThan(0)
      expect(result.nextPhoto.fileBuffer.byteLength).toBeGreaterThan(0)
    })

    it('rejects a missing rider name', async () => {
      const formData = createValidSubmitFormData()

      formData.set('riderName', '   ')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Rider name is required.'
      })
    })

    it('rejects a missing found location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationMapUrl', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location map link is required.'
      })
    })

    it('rejects an invalid found location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationMapUrl', 'https://example.com/not-a-map')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location map link must be a valid Google Maps link.'
      })
    })

    it('rejects a missing next tag title', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextTitle', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag title is required.'
      })
    })

    it('rejects a missing next tag clue', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextClue', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag clue is required.'
      })
    })

    it('rejects a missing hidden location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLocationMapUrl', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Hidden location map link is required.'
      })
    })

    it('rejects an invalid hidden location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLocationMapUrl', 'https://example.com/not-a-map')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Hidden location map link must be a valid Google Maps link.'
      })
    })

    it('rejects a missing matching photo', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('matchPhoto')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo is required.'
      })
    })

    it('rejects a missing next tag photo', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('nextPhoto')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo is required.'
      })
    })

    it('rejects unsupported matching photo MIME types', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({
          name: 'match.gif',
          type: 'image/gif'
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo must be a jpg, png, or webp image.'
      })
    })

    it('rejects mismatched next photo MIME type and extension pairs', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextPhoto',
        createImageFile({
          name: 'next.png',
          type: 'image/jpeg'
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo file extension must match the image type.'
      })
    })

    it('rejects oversized photos', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({
          name: 'large.jpg',
          type: 'image/jpeg',
          contents: [new Uint8Array(maxImageFileSizeInBytes + 1)]
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo must be smaller than 8 MB.'
      })
    })
  })
})