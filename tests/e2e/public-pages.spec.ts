import { expect, test } from '@playwright/test'
import { waitForNuxtHydration } from './helpers/nuxt'

const publicPages = [
  {
    path: '/',
    heading: 'Ride, find, tag, repeat.'
  },
  {
    path: '/current-tag',
    heading: 'Find the current Bike Tag.'
  },
  {
    path: '/tags',
    heading: 'Every found tag tells part of the ride.'
  },
  {
    path: '/map',
    heading: 'Explore where tags have been found.'
  },
  {
    path: '/rules',
    heading: 'How Bike Tag works'
  },
  {
    path: '/submission-status',
    heading: 'Check your Bike Tag submission.'
  },
  {
    path: '/settings',
    heading: 'Customize Bike Tag.'
  }
] as const

test.describe('public pages', () => {
  for (const publicPage of publicPages) {
    test(`${publicPage.path} renders without a server error`, async ({ page }) => {
      const serverErrors: string[] = []

      page.on('response', (response) => {
        if (response.status() >= 500) {
          serverErrors.push(`${response.status()} ${response.url()}`)
        }
      })

      const response = await page.goto(publicPage.path)

      expect(response?.ok()).toBe(true)
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: publicPage.heading
        })
      ).toBeVisible()
      expect(serverErrors).toEqual([])
    })
  }

  test('navigates from the home page to the active tag', async ({ page }) => {
    await page.goto('/')
    await waitForNuxtHydration(page)
    await page.getByRole('link', { name: 'View current tag' }).click()

    await expect(page).toHaveURL(/\/current-tag$/)
    await expect(
      page
        .getByRole('navigation', { name: 'Primary navigation' })
        .getByRole('link', { name: 'Current Tag', exact: true })
    ).toHaveAttribute('aria-current', 'page')
    await expect(
      page.getByRole('link', { name: 'I found this tag' })
    ).toBeVisible()
  })
})
