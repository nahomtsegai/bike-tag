import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

let handler: (event: never) => Promise<unknown>

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

const assertAdminRequestAccessMock = vi.hoisted(() => vi.fn())
const createSupabaseServerClientMock = vi.hoisted(() => vi.fn())
const deleteBikeTagPhotosMock = vi.hoisted(() => vi.fn())
const getStoragePathFromPublicUrlMock = vi.hoisted(() => vi.fn())
const readBodyMock = vi.hoisted(() => vi.fn())

vi.mock('../../server/utils/adminAuth', () => {
  return {
    assertAdminRequestAccess: assertAdminRequestAccessMock
  }
})

vi.mock('../../server/utils/supabase', () => {
  return {
    createSupabaseServerClient: createSupabaseServerClientMock
  }
})

vi.mock('../../server/utils/supabaseStorage', () => {
  return {
    deleteBikeTagPhotos: deleteBikeTagPhotosMock,
    getStoragePathFromPublicUrl: getStoragePathFromPublicUrlMock
  }
})

const createEvent = () => ({})

const defineEventHandlerMock = (
  eventHandler: (event: never) => Promise<unknown>
) => {
  return eventHandler
}

const createSupabaseMock = () => {
  const deleteTableCounts: Record<string, number> = {
    submissions: 2,
    tags: 3
  }

  return {
    from: vi.fn((tableName: string) => {
      return {
        select: vi.fn(() => {
          if (tableName === 'submissions') {
            return Promise.resolve({
              data: [
                {
                  match_photo_url: 'https://example.test/match-photo.jpg',
                  next_tag_photo_url: 'https://example.test/next-photo.jpg'
                }
              ],
              error: null
            })
          }

          if (tableName === 'tags') {
            return Promise.resolve({
              data: [
                {
                  tag_photo_url: 'https://example.test/tag-photo.jpg',
                  match_photo_url: null
                }
              ],
              error: null
            })
          }

          return Promise.resolve({ data: [], error: null })
        }),
        delete: vi.fn(() => {
          return {
            neq: vi.fn(() =>
              Promise.resolve({
                count: deleteTableCounts[tableName] ?? 0,
                error: null
              })
            )
          }
        })
      }
    })
  }
}

beforeAll(async () => {
  vi.stubGlobal('defineEventHandler', defineEventHandlerMock)
  handler = (
    await import('../../server/api/admin/cleanup/delete-game-data.post')
  ).default as typeof handler
})

describe('admin cleanup delete game data API', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    vi.stubGlobal('createError', createTestError)
    vi.stubGlobal('readBody', readBodyMock)
    vi.stubGlobal('useRuntimeConfig', () => {
      return {
        enableGameDataDelete: false
      }
    })

    readBodyMock.mockResolvedValue({
      confirmation: 'DELETE GAME DATA'
    })
    createSupabaseServerClientMock.mockReturnValue(createSupabaseMock())
    deleteBikeTagPhotosMock.mockResolvedValue(undefined)
    getStoragePathFromPublicUrlMock.mockImplementation((photoUrl: string) => {
      return photoUrl ? `photos/${photoUrl.split('/').pop()}` : ''
    })
  })

  it('blocks game data deletion when the environment guard is disabled', async () => {
    await expect(handler(createEvent() as never)).rejects.toMatchObject({
      statusCode: 403,
      statusMessage: 'Game data deletion is disabled in this environment.'
    })

    expect(assertAdminRequestAccessMock).toHaveBeenCalledWith(expect.anything())
    expect(readBodyMock).not.toHaveBeenCalled()
    expect(createSupabaseServerClientMock).not.toHaveBeenCalled()
    expect(deleteBikeTagPhotosMock).not.toHaveBeenCalled()
  })

  it('allows confirmed game data deletion when the environment guard is enabled', async () => {
    vi.stubGlobal('useRuntimeConfig', () => {
      return {
        enableGameDataDelete: true
      }
    })

    await expect(handler(createEvent() as never)).resolves.toEqual({
      success: true,
      message: 'Game data deleted.',
      deletedSubmissionCount: 2,
      deletedTagCount: 3,
      deletedStoragePathCount: 3,
      storageCleanupError: null
    })

    expect(readBodyMock).toHaveBeenCalledWith(expect.anything())
    expect(deleteBikeTagPhotosMock).toHaveBeenCalledWith([
      'photos/match-photo.jpg',
      'photos/next-photo.jpg',
      'photos/tag-photo.jpg'
    ])
  })
})