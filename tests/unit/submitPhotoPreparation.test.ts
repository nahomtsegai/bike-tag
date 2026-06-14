import { beforeEach, describe, expect, it, vi } from 'vitest'

const compressionMocks = vi.hoisted(() => {
  return {
    compressImageFile: vi.fn(),
    compressImageFileToMaxSize: vi.fn()
  }
})

vi.mock('../../app/utils/imageCompression', () => {
  return compressionMocks
})

import {
  getSubmitPhotoTargetSizes,
  prepareSubmitPhotos,
  SubmitPhotoPayloadTooLargeError,
  SubmitPhotoPreparationError
} from '../../app/utils/submitPhotoPreparation'

const createFile = (name: string, size: number) => {
  return new File(
    [new Uint8Array(size)],
    name,
    {
      type: 'image/jpeg',
      lastModified: 123
    }
  )
}

describe('submitPhotoPreparation', () => {
  beforeEach(() => {
    compressionMocks.compressImageFile.mockReset()
    compressionMocks.compressImageFileToMaxSize.mockReset()
  })

  describe('getSubmitPhotoTargetSizes', () => {
    it('preserves a smaller photo and gives the remaining budget to the larger photo', () => {
      expect(
        getSubmitPhotoTargetSizes({
          matchPhotoSize: 750_000,
          nextPhotoSize: 4_000_000,
          maxCombinedSize: 4_000_000
        })
      ).toEqual({
        matchPhotoTargetSize: 750_000,
        nextPhotoTargetSize: 3_250_000
      })
    })

    it('splits the budget evenly when both photos use more than half', () => {
      expect(
        getSubmitPhotoTargetSizes({
          matchPhotoSize: 3_000_000,
          nextPhotoSize: 3_000_000,
          maxCombinedSize: 4_000_000
        })
      ).toEqual({
        matchPhotoTargetSize: 2_000_000,
        nextPhotoTargetSize: 2_000_000
      })
    })
  })

  it('keeps the first prepared photos when they already fit the combined budget', async () => {
    const matchPhoto = createFile('match.jpg', 3_000_000)
    const nextPhoto = createFile('next.jpg', 3_000_000)
    const preparedMatchPhoto = createFile('match-compressed.jpg', 1_200_000)
    const preparedNextPhoto = createFile('next-compressed.jpg', 1_300_000)

    compressionMocks.compressImageFile
      .mockResolvedValueOnce(preparedMatchPhoto)
      .mockResolvedValueOnce(preparedNextPhoto)

    await expect(
      prepareSubmitPhotos({ matchPhoto, nextPhoto })
    ).resolves.toEqual({
      matchPhoto: preparedMatchPhoto,
      nextPhoto: preparedNextPhoto
    })

    expect(
      compressionMocks.compressImageFileToMaxSize
    ).not.toHaveBeenCalled()
  })

  it('recompresses only the larger photo when the smaller photo fits within half the budget', async () => {
    const matchPhoto = createFile('match.jpg', 1_000_000)
    const nextPhoto = createFile('next.jpg', 6_000_000)
    const preparedNextPhoto = createFile('next-compressed.jpg', 3_500_000)
    const targetedNextPhoto = createFile('next-targeted.jpg', 3_000_000)

    compressionMocks.compressImageFile
      .mockResolvedValueOnce(matchPhoto)
      .mockResolvedValueOnce(preparedNextPhoto)
    compressionMocks.compressImageFileToMaxSize.mockResolvedValueOnce(
      targetedNextPhoto
    )

    await expect(
      prepareSubmitPhotos({ matchPhoto, nextPhoto })
    ).resolves.toEqual({
      matchPhoto,
      nextPhoto: targetedNextPhoto
    })

    expect(
      compressionMocks.compressImageFileToMaxSize
    ).toHaveBeenCalledTimes(1)
    expect(
      compressionMocks.compressImageFileToMaxSize
    ).toHaveBeenCalledWith(nextPhoto, 3_000_000)
  })

  it('targets both photos when each prepared photo uses more than half the budget', async () => {
    const matchPhoto = createFile('match.jpg', 6_000_000)
    const nextPhoto = createFile('next.jpg', 6_000_000)
    const firstMatchPhoto = createFile('match-first.jpg', 3_000_000)
    const firstNextPhoto = createFile('next-first.jpg', 3_000_000)
    const finalMatchPhoto = createFile('match-final.jpg', 1_900_000)
    const finalNextPhoto = createFile('next-final.jpg', 1_900_000)

    compressionMocks.compressImageFile
      .mockResolvedValueOnce(firstMatchPhoto)
      .mockResolvedValueOnce(firstNextPhoto)
    compressionMocks.compressImageFileToMaxSize
      .mockResolvedValueOnce(finalMatchPhoto)
      .mockResolvedValueOnce(finalNextPhoto)

    await expect(
      prepareSubmitPhotos({ matchPhoto, nextPhoto })
    ).resolves.toEqual({
      matchPhoto: finalMatchPhoto,
      nextPhoto: finalNextPhoto
    })

    expect(
      compressionMocks.compressImageFileToMaxSize
    ).toHaveBeenNthCalledWith(1, matchPhoto, 2_000_000)
    expect(
      compressionMocks.compressImageFileToMaxSize
    ).toHaveBeenNthCalledWith(2, nextPhoto, 2_000_000)
  })

  it('throws a payload error when the strongest compression still exceeds the budget', async () => {
    const matchPhoto = createFile('match.jpg', 6_000_000)
    const nextPhoto = createFile('next.jpg', 6_000_000)
    const oversizedMatchPhoto = createFile('match-final.jpg', 2_100_000)
    const oversizedNextPhoto = createFile('next-final.jpg', 2_100_000)

    compressionMocks.compressImageFile
      .mockResolvedValueOnce(createFile('match-first.jpg', 3_000_000))
      .mockResolvedValueOnce(createFile('next-first.jpg', 3_000_000))
    compressionMocks.compressImageFileToMaxSize
      .mockResolvedValueOnce(oversizedMatchPhoto)
      .mockResolvedValueOnce(oversizedNextPhoto)

    await expect(
      prepareSubmitPhotos({ matchPhoto, nextPhoto })
    ).rejects.toMatchObject<SubmitPhotoPayloadTooLargeError>({
      name: 'SubmitPhotoPayloadTooLargeError',
      matchPhotoSize: 2_100_000,
      nextPhotoSize: 2_100_000,
      maxCombinedSize: 4_000_000
    })
  })

  it('wraps a compression failure with the photo field that failed', async () => {
    const matchPhoto = createFile('match.jpg', 6_000_000)
    const nextPhoto = createFile('next.jpg', 6_000_000)
    const originalError = new Error('canvas failed')

    compressionMocks.compressImageFile.mockRejectedValueOnce(originalError)

    await expect(
      prepareSubmitPhotos({ matchPhoto, nextPhoto })
    ).rejects.toMatchObject<SubmitPhotoPreparationError>({
      name: 'SubmitPhotoPreparationError',
      field: 'matchPhoto',
      file: matchPhoto,
      originalError
    })
  })
})
