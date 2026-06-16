import { defineConfig, devices } from '@playwright/test'

const testPort = 4174
const baseURL = `http://localhost:${testPort}`
const workflowGeolocation = {
  latitude: 38.2527,
  longitude: -85.7585,
  accuracy: 5
}
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
    timeout: 20_000
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
    geolocation: workflowGeolocation,
    permissions: ['geolocation'],
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: chromiumExecutablePath ? 'off' : 'retain-on-failure'
  },
  webServer: {
    command: 'node .output/server/index.mjs',
    env: {
      NITRO_HOST: 'localhost',
      NITRO_PORT: String(testPort)
    },
    reuseExistingServer: false,
    timeout: 120_000,
    url: baseURL
  },
  projects: [
    {
      name: 'workflow-chromium',
      use: {
        ...devices['Desktop Chrome'],
        geolocation: workflowGeolocation,
        permissions: ['geolocation'],
        launchOptions: chromiumExecutablePath
          ? { executablePath: chromiumExecutablePath }
          : undefined
      }
    }
  ]
})
