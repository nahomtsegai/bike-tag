import { expect, test } from '@playwright/test'
import { waitForNuxtHydration } from './helpers/nuxt'

test.describe('tag history', () => {
  test('filters previous tags and opens a tag detail', async ({ page }) => {
    await page.goto('/tags')
    await waitForNuxtHydration(page)

    const searchInput = page.getByRole('searchbox', {
      name: 'Search previous tags'
    })

    await expect(page.getByRole('link', { name: /River trail mural/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /Coffee stop corner/ })).toBeVisible()

    await searchInput.fill('coffee')

    await expect(page.getByRole('link', { name: /Coffee stop corner/ })).toBeVisible()
    await expect(page.getByRole('link', { name: /River trail mural/ })).toBeHidden()
    await expect(page.getByText('Showing 1 matching tag.')).toBeVisible()

    await page.getByRole('link', { name: /Coffee stop corner/ }).click()

    await expect(page).toHaveURL(/\/tag\/tag-coffee-stop$/)
    await expect(
      page.getByRole('heading', { level: 1, name: 'Coffee stop corner' })
    ).toBeVisible()
  })

  test('shows a useful empty state and clears the search', async ({ page }) => {
    await page.goto('/tags')
    await waitForNuxtHydration(page)

    await page
      .getByRole('searchbox', { name: 'Search previous tags' })
      .fill('no tag should match this text')

    await expect(
      page.getByRole('heading', { name: 'No tags matched your search.' })
    ).toBeVisible()

    await page.getByRole('button', { name: 'Clear search' }).last().click()

    await expect(page.getByRole('link', { name: /River trail mural/ })).toBeVisible()
  })
})
