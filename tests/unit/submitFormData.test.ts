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
  formData.append('foundLocationAccuracyMeters', '15')
  formData.append('foundLocationCapturedAt', '2026-05-31T15:00:00.000Z')
  formData.append('nextTitle', ' Smoke Test Tag ')
  formData.append('nextClue', ' Look near the bike rack. ')
  formData.append('nextHiddenLatitude', '38.2561')
  formData.append('nextHiddenLongitude', '-85.7514')
  formData.append('nextHiddenLocationAccuracyMeters', '12')
  formData.append('nextHiddenLocationCapturedAt', '2026-05-31T15:15:00.000Z')
  formData.append('matchPhoto', createImageFile({ name: 'match.jpg' }))
  formData.append(
    'nextPhoto',
    createImageFile({
      name: 'next.webp',
      type: 'image/webp'
    })
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
        foundLocationAccuracyMeters: 15,
        foundLocationCapturedAt: '2026-05-31T15:00:00.000Z',
        nextTitle: 'Smoke Test Tag',
        nextClue: 'Look near the bike rack.',
        nextHiddenLocationMapUrl:
          'https://www.google.com/maps?q=38.2561,-85.7514',
        nextHiddenLatitude: 38.2561,
        nextHiddenLongitude: -85.7514,
        nextHiddenLocationAccuracyMeters: 12,
        nextHiddenLocationCapturedAt: '2026-05-31T15:15:00.000Z',
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

      formData.set('riderName', ' ')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Rider name is required.'
      })
    })

    it('rejects a missing found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLatitude')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude is required.'
      })
    })

    it('rejects an invalid found latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLatitude', '120')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found latitude is invalid.'
      })
    })

    it('rejects a missing found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLongitude')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude is required.'
      })
    })

    it('rejects an invalid found longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLongitude', '-200')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found longitude is invalid.'
      })
    })

    it('rejects a missing found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLocationAccuracyMeters')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy is required.'
      })
    })

    it('rejects an invalid found location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationAccuracyMeters', '-1')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location accuracy is invalid.'
      })
    })

    it('rejects a missing found location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('foundLocationCapturedAt')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Found location captured time is required.'
      })
    })

    it('rejects an invalid found location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.set('foundLocationCapturedAt', 'not a date')

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

    it('rejects a missing next tag clue', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextClue', '')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next tag clue is required.'
      })
    })

    it('rejects a missing next hidden latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('nextHiddenLatitude')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden latitude is required.'
      })
    })

    it('rejects an invalid next hidden latitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLatitude', '120')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden latitude is invalid.'
      })
    })

    it('rejects a missing next hidden longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('nextHiddenLongitude')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden longitude is required.'
      })
    })

    it('rejects an invalid next hidden longitude', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLongitude', '-200')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden longitude is invalid.'
      })
    })

    it('rejects a missing next hidden location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('nextHiddenLocationAccuracyMeters')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden location accuracy is required.'
      })
    })

    it('rejects an invalid next hidden location accuracy', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLocationAccuracyMeters', '-1')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden location accuracy is invalid.'
      })
    })

    it('rejects a missing next hidden location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.delete('nextHiddenLocationCapturedAt')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden location captured time is required.'
      })
    })

    it('rejects an invalid next hidden location captured time', async () => {
      const formData = createValidSubmitFormData()

      formData.set('nextHiddenLocationCapturedAt', 'not a date')

      await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
        statusCode: 400,
        statusMessage: 'Next hidden location captured time is invalid.'
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