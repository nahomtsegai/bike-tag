import { expect, test } from '@playwright/test'

import { waitForNuxtHydration } from './helpers/nuxt'

const siteUrl = 'https://www.louisvillebiketag.com'

test('public routes expose route-specific SEO metadata', async ({ page }) => {
  await page.goto('/rules')
  await waitForNuxtHydration(page)

  await expect(page).toHaveTitle('How to Play | Louisville Bike Tag')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    'Learn the Louisville Bike Tag rules: find the current location, match the photo, and hide the next tag.'
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteUrl}/rules`
  )
  await expect(page.locator('meta[property="og:url"]')).toHaveCount(1)
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    `${siteUrl}/rules`
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'index, follow'
  )
})

test('submission pages are noindex and omit reference queries from canonicals', async ({
  page
}) => {
  await page.goto('/submit/success?reference=test-reference')
  await waitForNuxtHydration(page)

  await expect(page).toHaveTitle('Submission Received | Louisville Bike Tag')
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    `${siteUrl}/submit/success`
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    'noindex, nofollow'
  )
})

test('robots.txt advertises the public sitemap', async ({ request }) => {
  const response = await request.get('/robots.txt')

  expect(response.ok()).toBe(true)
  expect(await response.text()).toContain(
    'Sitemap: https://www.louisvillebiketag.com/sitemap.xml'
  )
})
