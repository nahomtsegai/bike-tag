import { expect, test } from '@playwright/test'
import { waitForNuxtHydration } from './helpers/nuxt'

test.describe('settings and responsive navigation', () => {
  test('persists the selected theme after reload', async ({ page }) => {
    await page.goto('/settings')
    await waitForNuxtHydration(page)

    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      /^(light|dark)$/
    )
    await page.getByRole('button', { name: 'Dark' }).click()

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await page.reload()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.getByRole('button', { name: 'Dark' })).toHaveClass(
      /activeTheme/
    )
  })

  test('opens the mobile menu and closes it after navigation', async ({ page }) => {
    await page.setViewportSize({
      width: 390,
      height: 844
    })
    await page.goto('/')
    await waitForNuxtHydration(page)

    const menuButton = page.getByRole('button', {
      name: 'Toggle navigation menu'
    })

    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await menuButton.click()
    await expect(menuButton).toHaveAttribute('aria-expanded', 'true')

    const primaryNavigation = page.getByRole('navigation', {
      name: 'Primary navigation'
    })

    await primaryNavigation
      .getByRole('link', { name: 'Rules', exact: true })
      .click()

    await expect(page).toHaveURL(/\/rules$/)
    await expect(menuButton).toHaveAttribute('aria-expanded', 'false')
    await expect(
      page.locator('#primaryNavigation a[href="/rules"]')
    ).toHaveAttribute('aria-current', 'page')
  })
})
