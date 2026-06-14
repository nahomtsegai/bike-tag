import { expect, test } from '@playwright/test'

type CurrentTagResponse = {
  currentTag: null | Record<string, unknown>
}

type FoundTagResponse = Record<string, unknown>

const expectNoPrivateLocationFields = (value: Record<string, unknown>) => {
  expect(value).not.toHaveProperty('hiddenLocationMapUrl')
  expect(value).not.toHaveProperty('nextHiddenLocationMapUrl')
  expect(value).not.toHaveProperty('nextHiddenLatitude')
  expect(value).not.toHaveProperty('nextHiddenLongitude')
}

test.describe('public tag API', () => {
  test('returns the active tag without private location fields', async ({
    request
  }) => {
    const response = await request.get('/api/tags/current')

    expect(response.ok()).toBe(true)

    const payload = (await response.json()) as CurrentTagResponse

    expect(payload).toHaveProperty('currentTag')

    if (!payload.currentTag) {
      return
    }

    expect(payload.currentTag).toMatchObject({
      status: 'active'
    })
    expect(payload.currentTag).toHaveProperty('id')
    expect(payload.currentTag).toHaveProperty('title')
    expect(payload.currentTag).toHaveProperty('createdAtIso')
    expectNoPrivateLocationFields(payload.currentTag)
  })

  test('returns found tags with only public location data', async ({
    request
  }) => {
    const response = await request.get('/api/tags')

    expect(response.ok()).toBe(true)

    const payload = (await response.json()) as FoundTagResponse[]

    expect(Array.isArray(payload)).toBe(true)

    for (const tag of payload) {
      expect(tag).toMatchObject({
        status: 'found'
      })
      expect(tag).toHaveProperty('id')
      expect(tag).toHaveProperty('title')
      expectNoPrivateLocationFields(tag)
    }
  })

  test('returns a public tag detail and a 404 for an unknown tag', async ({
    request
  }) => {
    const tagsResponse = await request.get('/api/tags')
    const tags = (await tagsResponse.json()) as FoundTagResponse[]

    expect(tags.length).toBeGreaterThan(0)

    const firstTagId = String(tags[0]?.id)
    const detailResponse = await request.get(
      `/api/tags/${encodeURIComponent(firstTagId)}`
    )

    expect(detailResponse.ok()).toBe(true)

    const detail = (await detailResponse.json()) as Record<string, unknown>

    expect(detail.id).toBe(firstTagId)
    expect(detail.status).toBe('found')
    expectNoPrivateLocationFields(detail)

    const missingResponse = await request.get(
      '/api/tags/definitely-not-a-real-tag'
    )

    expect(missingResponse.status()).toBe(404)
  })
})
