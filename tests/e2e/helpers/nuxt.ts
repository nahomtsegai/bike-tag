import type { Page } from '@playwright/test'

type NuxtRootElement = HTMLElement & {
  __vue_app__?: unknown
}

export const waitForNuxtHydration = async (page: Page) => {
  await page.waitForFunction(() => {
    const nuxtRoot = document.querySelector<NuxtRootElement>('#__nuxt')

    return Boolean(nuxtRoot?.__vue_app__)
  })
}
