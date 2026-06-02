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
    })

    it('requires rider name', async () => {
      const formData = createValidSubmitFormData()

      formData.set('riderName', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Rider name is required.'
      })
    })

    it('requires found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLatitude')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude is required.'
      })
    })

    it('rejects invalid found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLatitude', '120')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude is invalid.'
      })
    })

    it('requires found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLongitude')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude is required.'
      })
    })

    it('rejects invalid found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLongitude', '-200')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude is invalid.'
      })
    })

    it('requires found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLocationAccuracyMeters')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy is required.'
      })
    })

    it('rejects invalid found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationAccuracyMeters', '-1')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy is invalid.'
      })
    })

    it('requires found location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLocationCapturedAt')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location captured time is required.'
      })
    })

    it('rejects invalid found location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationCapturedAt', 'not a date')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location captured time is invalid.'
      })
    })

    it('requires next tag title', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextTitle', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag title is required.'
      })
    })

    it('requires next tag clue', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextClue', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag clue is required.'
      })
    })

    it('requires hidden location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLocationMapUrl', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Hidden location map link is required.'
      })
    })

    it('rejects invalid hidden location map link', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLocationMapUrl', 'not a url')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Hidden location map link must be a valid map link.'
      })
    })

    it('requires matching photo', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('matchPhoto')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo is required.'
      })
    })

    it('requires next tag photo', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('nextPhoto')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo is required.'
      })
    })

    it('rejects image files with invalid MIME type', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({ name: 'match.txt', type: 'text/plain' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Matching photo must be a jpg, png, or webp image.'
      })
    })

    it('rejects image files with mismatched extension', async () => {
      const formData = createValidSubmitFormData()

      formData.set(
        'matchPhoto',
        createImageFile({ name: 'match.png', type: 'image/jpeg' })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage:
          'Matching photo file extension must match the image type.'
      })
    })

    it('rejects image files that are too large', async () => {
      const formData = createValidSubmitFormData()
      const largeContents = [new Uint8Array(maxImageFileSizeInBytes + 1)]

      formData.set(
        'nextPhoto',
        createImageFile({
          name: 'next.jpg',
          type: 'image/jpeg',
          contents: largeContents
        })
      )

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag photo must be smaller than 8 MB.'
      })
    })
  })
})