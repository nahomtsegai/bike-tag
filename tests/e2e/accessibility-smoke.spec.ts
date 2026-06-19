import { expect, test, type Page } from '@playwright/test'

import { waitForNuxtHydration } from './helpers/nuxt'

const criticalPages = [
  {
    path: '/',
    heading: 'Ride, find, tag, repeat.'
  },
  {
    path: '/current-tag',
    heading: 'Find the current Bike Tag.'
  },
  {
    path: '/submit',
    heading: 'Found the tag? Claim it, then hide the next one.'
  },
  {
    path: '/submission-status',
    heading: 'Check your Bike Tag submission.'
  }
] as const

const collectAccessibilitySmokeViolations = async (page: Page) => {
  return page.evaluate(() => {
    const isVisible = (element: Element) => {
      const htmlElement = element as HTMLElement
      const style = window.getComputedStyle(htmlElement)
      const bounds = htmlElement.getBoundingClientRect()

      return (
        style.display !== 'none' &&
        style.visibility !== 'hidden' &&
        bounds.width > 0 &&
        bounds.height > 0
      )
    }

    const getElementLabel = (element: Element) => {
      const htmlElement = element as HTMLElement
      return (
        htmlElement.getAttribute('aria-label') ||
        htmlElement.getAttribute('title') ||
        htmlElement.textContent?.trim() ||
        htmlElement.tagName.toLowerCase()
      )
    }

    const violations: string[] = []
    const ids = new Map<string, number>()

    for (const element of document.querySelectorAll('[id]')) {
      const id = element.id.trim()
      if (!id) {
        continue
      }

      ids.set(id, (ids.get(id) ?? 0) + 1)
    }

    for (const [id, count] of ids) {
      if (count > 1) {
        violations.push(`Duplicate id: ${id}`)
      }
    }

    for (const image of document.querySelectorAll('img')) {
      if (isVisible(image) && !image.hasAttribute('alt')) {
        violations.push(`Visible image is missing alt text: ${image.src}`)
      }
    }

    for (const control of document.querySelectorAll<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >('input:not([type="hidden"]), select, textarea')) {
      if (!isVisible(control)) {
        continue
      }

      const hasAccessibleName =
        Boolean(control.labels?.length) ||
        Boolean(control.getAttribute('aria-label')?.trim()) ||
        Boolean(control.getAttribute('aria-labelledby')?.trim())

      if (!hasAccessibleName) {
        violations.push(
          `Form control is missing an accessible name: ${control.id || control.name || control.type}`
        )
      }
    }

    for (const interactiveElement of document.querySelectorAll(
      'a[href], button'
    )) {
      if (!isVisible(interactiveElement)) {
        continue
      }

      const labelledBy = interactiveElement.getAttribute('aria-labelledby')
      const labelledByText = labelledBy
        ?.split(/\s+/)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ')
        .trim()
      const accessibleName =
        interactiveElement.getAttribute('aria-label')?.trim() ||
        labelledByText ||
        interactiveElement.textContent?.trim() ||
        interactiveElement.getAttribute('title')?.trim() ||
        interactiveElement.querySelector('img')?.getAttribute('alt')?.trim()

      if (!accessibleName) {
        violations.push(
          `Interactive element is missing an accessible name: ${getElementLabel(interactiveElement)}`
        )
      }
    }

    return violations
  })
}

test.describe('accessibility smoke coverage', () => {
  for (const criticalPage of criticalPages) {
    test(`${criticalPage.path} exposes a usable accessibility structure`, async ({
      page
    }) => {
      await page.goto(criticalPage.path)
      await waitForNuxtHydration(page)

      await expect(page.getByRole('main')).toBeVisible()
      await expect(
        page.getByRole('heading', {
          level: 1,
          name: criticalPage.heading
        })
      ).toBeVisible()
      await expect(page.locator('h1:visible')).toHaveCount(1)
      await expect(
        page.getByRole('navigation', { name: 'Primary navigation' })
      ).toBeVisible()
      await expect(
        page.getByRole('navigation', { name: 'Footer navigation' })
      ).toBeVisible()

      expect(await collectAccessibilitySmokeViolations(page)).toEqual([])
    })
  }

  test('submit form exposes accessible names for its required fields', async ({
    page
  }) => {
    await page.goto('/submit')
    await waitForNuxtHydration(page)

    await expect(page.getByLabel('Rider name')).toBeVisible()
    await expect(page.getByLabel('Match photo')).toBeAttached()
    await expect(page.getByLabel('Next tag title')).toBeVisible()
    await expect(page.getByLabel('Next tag clue')).toBeVisible()
    await expect(page.getByLabel('Next tag photo')).toBeAttached()
    await expect(
      page.getByRole('button', { name: 'Check required fields' })
    ).toBeVisible()
  })

  test('submission status lookup supports keyboard progression', async ({
    page
  }) => {
    await page.goto('/submission-status')
    await waitForNuxtHydration(page)

    const referenceInput = page.getByLabel('Submission reference code')
    const submitButton = page.getByRole('button', { name: 'Check status' })

    await referenceInput.fill('123e4567-e89b-42d3-a456-426614174000')
    await expect(submitButton).toBeEnabled()
    await referenceInput.focus()
    await expect(referenceInput).toBeFocused()

    await page.keyboard.press('Tab')
    await expect(submitButton).toBeFocused()
  })
})
