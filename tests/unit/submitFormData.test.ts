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

  formData.append('riderName', ' Test Rider ')
  formData.append('foundLatitude', '38.2527')
  formData.append('foundLongitude', '-85.7585')
  formData.append('foundLocationAccuracyMeters', '24')
  formData.append('foundLocationCapturedAt', '2026-05-29T12:00:00.000Z')
  formData.append('nextTitle', ' Smoke Test Tag ')
  formData.append('nextClue', ' Look near the bike rack. ')
  formData.append(
    'nextHiddenLocationMapUrl',
    ' https://maps.google.com/maps?q=Louisville '
  )
  formData.append('matchPhoto', createImageFile({ name: 'match.jpg' }))
  formData.append(
    'nextPhoto',
    createImageFile({ name: 'next.webp', type: 'image/webp' })
  )

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
        foundLocationMapUrl: 'https://www.google.com/maps?q=38.2527,-85.7585',
        foundLatitude: 38.2527,
        foundLongitude: -85.7585,
        foundLocationAccuracyMeters: 24,
        foundLocationCapturedAt: '2026-05-29T12:00:00.000Z',
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

    it('parses png photos when the MIME type and extension match', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({ name: 'match.png', type: 'image/png' })
      )
      formData.set(
        'nextPhoto',
        createImageFile({ name: 'next.png', type: 'image/png' })
      )

      const result = await parseSubmitFormData(formData)

      expect(result.matchPhoto).toMatchObject({
        fileName: 'match.png',
        mimeType: 'image/png'
      })
      expect(result.nextPhoto).toMatchObject({
        fileName: 'next.png',
        mimeType: 'image/png'
      })
    })

    it('parses jpeg photos when the MIME type and jpeg extension match', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({ name: 'match.jpeg', type: 'image/jpeg' })
      )
      formData.set(
        'nextPhoto',
        createImageFile({ name: 'next.jpeg', type: 'image/jpeg' })
      )

      const result = await parseSubmitFormData(formData)

      expect(result.matchPhoto).toMatchObject({
        fileName: 'match.jpeg',
        mimeType: 'image/jpeg'
      })
      expect(result.nextPhoto).toMatchObject({
        fileName: 'next.jpeg',
        mimeType: 'image/jpeg'
      })
    })

    it('trims text fields before returning the parsed payload', async () => {
      const result = await parseSubmitFormData(createValidSubmitFormData())

      expect(result.riderName).toBe('Test Rider')
      expect(result.foundLocationMapUrl).toBe(
        'https://www.google.com/maps?q=38.2527,-85.7585'
      )
      expect(result.nextTitle).toBe('Smoke Test Tag')
      expect(result.nextClue).toBe('Look near the bike rack.')
      expect(result.nextHiddenLocationMapUrl).toBe(
        'https://maps.google.com/maps?q=Louisville'
      )
    })

    it('rejects a missing rider name', async () => {
      const formData = createValidSubmitFormData()

      formData.set('riderName', ' ')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Rider name is required.'
      })
    })

    it('rejects an overly long rider name', async () => {
      const formData = createValidSubmitFormData()

      formData.set('riderName', 'a'.repeat(51))

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Rider name is too long.'
      })
    })

    it('rejects a missing found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLatitude', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude is required.'
      })
    })

    it('rejects an invalid found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLatitude', 'not-a-number')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude must be a valid number.'
      })
    })

    it('rejects an out of range found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLatitude', '91')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude is invalid.'
      })
    })

    it('rejects a missing found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLongitude', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude is required.'
      })
    })

    it('rejects an invalid found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLongitude', 'not-a-number')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude must be a valid number.'
      })
    })

    it('rejects an out of range found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLongitude', '-181')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude is invalid.'
      })
    })

    it('rejects a missing found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationAccuracyMeters', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy is required.'
      })
    })

    it('rejects an invalid found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationAccuracyMeters', 'not-a-number')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy must be a valid number.'
      })
    })

    it('rejects a negative found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationAccuracyMeters', '-1')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy is invalid.'
      })
    })

    it('rejects a missing found location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationCapturedAt', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location captured time is required.'
      })
    })

    it('rejects an invalid found location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationCapturedAt', 'not-a-date')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location captured time is invalid.'
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

    it('rejects an overly long next tag title', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextTitle', 'a'.repeat(81))

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag title is too long.'
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

    it('rejects an overly long next tag clue', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextClue', 'a'.repeat(501))

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag clue is too long.'
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

    it('rejects an overly long hidden location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextHiddenLocationMapUrl',
        `https://maps.google.com/maps?q=${'a'.repeat(2049)}`
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Hidden location map link is too long.'
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
        createImageFile({ name: 'match.gif', type: 'image/gif' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo must be a jpg, png, or webp image.'
      })
    })

    it('rejects unsupported next tag photo MIME types', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextPhoto',
        createImageFile({ name: 'next.gif', type: 'image/gif' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo must be a jpg, png, or webp image.'
      })
    })

    it('rejects mismatched matching photo MIME type and extension pairs', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({ name: 'match.webp', type: 'image/jpeg' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo file extension must match the image type.'
      })
    })

    it('rejects mismatched next photo MIME type and extension pairs', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextPhoto',
        createImageFile({ name: 'next.png', type: 'image/jpeg' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo file extension must match the image type.'
      })
    })

    it('rejects matching photos without file extensions', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({ name: 'match', type: 'image/jpeg' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo file extension must match the image type.'
      })
    })

    it('rejects next tag photos without file extensions', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextPhoto',
        createImageFile({ name: 'next', type: 'image/webp' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo file extension must match the image type.'
      })
    })

    it('rejects empty matching photo files', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({
          name: 'empty.jpg',
          type: 'image/jpeg',
          contents: []
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo must be smaller than 8 MB.'
      })
    })

    it('rejects empty next tag photo files', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextPhoto',
        createImageFile({
          name: 'empty.webp',
          type: 'image/webp',
          contents: []
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo must be smaller than 8 MB.'
      })
    })

    it('rejects oversized matching photos', async () => {
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

    it('rejects oversized next tag photos', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'nextPhoto',
        createImageFile({
          name: 'large.webp',
          type: 'image/webp',
          contents: [new Uint8Array(maxImageFileSizeInBytes + 1)]
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo must be smaller than 8 MB.'
      })
    })
  })
})