import { defineConfig, devices } from '@playwright/test'

const testPort = 4173
const baseURL = `http://127.0.0.1:${testPort}`
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined

export default defineConfig({
  testDir: './tests',
  testIgnore: ['unit/**'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000
  },
  reporter: process.env.CI
    ? [
        ['line'],
        ['html', { open: 'never' }]
      ]
    : 'list',
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: chromiumExecutablePath ? 'off' : 'retain-on-failure'
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${testPort}`,
    env: {
      NUXT_TAG_DATA_SOURCE: 'mock',
      NUXT_PUBLIC_SITE_URL: baseURL
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    url: `${baseURL}/api/tags/current`
  },
  projects: [
    {
      name: 'api',
      testMatch: 'api/**/*.spec.ts'
    },
    {
      name: 'chromium',
      testMatch: 'e2e/**/*.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : undefined
      }
    }
  ]
})
