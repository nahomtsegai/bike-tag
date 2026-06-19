import { expect, test } from '@playwright/test'

import { waitForNuxtHydration } from './helpers/nuxt'

test('keyboard users can skip directly to page content', async ({ page }) => {
  await page.goto('/')
  await waitForNuxtHydration(page)

  const skipLink = page.getByRole('link', { name: 'Skip to main content' })
  const mainContent = page.locator('#main-content')

  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(mainContent).toBeFocused()
})
