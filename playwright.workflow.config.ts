import { defineConfig, devices } from '@playwright/test'

const testPort = 4174
const baseURL = `http://127.0.0.1:${testPort}`
const chromiumExecutablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined

export default defineConfig({
  testDir: './tests/workflow',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000
  },
  reporter: process.env.CI
    ? [
        ['line'],
        [
          'html',
          {
            open: 'never',
            outputFolder: 'playwright-report/workflow'
          }
        ]
      ]
    : 'list',
  outputDir: 'test-results/workflow',
  use: {
    baseURL,
    geolocation: {
      latitude: 38.2527,
      longitude: -85.7585
    },
    permissions: ['geolocation'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: chromiumExecutablePath ? 'off' : 'retain-on-failure'
  },
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${testPort}`,
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL
  },
  projects: [
    {
      name: 'workflow-chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : undefined
      }
    }
  ]
})
