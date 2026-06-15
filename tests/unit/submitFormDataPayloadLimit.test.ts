import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  maxCombinedSubmitPhotoSizeInBytes,
  maxCombinedSubmitPhotoSizeLabel
} from '../../shared/utils/imageValidation'
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

const createSizedJpegFile = (name: string, sizeInBytes: number) => {
  const contents = new Uint8Array(sizeInBytes)

  contents.set([0xff, 0xd8, 0xff, 0xe0], 0)

  return new File([contents], name, { type: 'image/jpeg' })
}

const createValidSubmitFormData = ({
  matchPhotoSize,
  nextPhotoSize
}: {
  matchPhotoSize: number
  nextPhotoSize: number
}) => {
  const formData = new FormData()

  formData.append('clientSubmissionId', '11111111-1111-4111-8111-111111111111')
  formData.append('diagnosticSessionId', 'diagnostic-session-123')
  formData.append('riderName', 'Test Rider')
  formData.append('foundLocationMapUrl', 'https://maps.google.com/maps?q=Current+Tag')
  formData.append('foundLatitude', '38.2527')
  formData.append('foundLongitude', '-85.7585')
  formData.append('foundLocationAccuracyMeters', '24')
  formData.append('foundLocationCapturedAt', '2026-05-29T12:00:00.000Z')
  formData.append('nextTitle', 'Smoke Test Tag')
  formData.append('nextClue', 'Look near the bike rack.')
  formData.append('nextHiddenLocationMapUrl', 'https://maps.google.com/maps?q=Louisville')
  formData.append('matchPhoto', createSizedJpegFile('match.jpg', matchPhotoSize))
  formData.append('nextPhoto', createSizedJpegFile('next.jpg', nextPhotoSize))

  return formData
}

describe('submitFormData payload limit', () => {
  beforeEach(() => {
    vi.stubGlobal('createError', createTestError)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('accepts prepared submission photos at the combined upload limit', async () => {
    const formData = createValidSubmitFormData({
      matchPhotoSize: 2_000_000,
      nextPhotoSize: maxCombinedSubmitPhotoSizeInBytes - 2_000_000
    })

    await expect(parseSubmitFormData(formData)).resolves.toMatchObject({
      matchPhoto: {
        fileName: 'match.jpg',
        mimeType: 'image/jpeg'
      },
      nextPhoto: {
        fileName: 'next.jpg',
        mimeType: 'image/jpeg'
      }
    })
  })

  it('rejects submission photos above the combined upload limit', async () => {
    const formData = createValidSubmitFormData({
      matchPhotoSize: 2_000_001,
      nextPhotoSize: 2_000_000
    })

    await expect(parseSubmitFormData(formData)).rejects.toMatchObject({
      statusCode: 400,
      statusMessage: `Submission photos must total no more than ${maxCombinedSubmitPhotoSizeLabel}.`
    })
  })
})
