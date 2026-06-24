import { existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

const supabaseVersion = '2.106.0'
const npxCommand = process.platform === 'win32' ? 'npx.cmd' : 'npx'

const runCommand = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    ...options
  })

  if (result.status !== 0) {
    if (result.stdout) {
      process.stdout.write(result.stdout)
    }

    if (result.stderr) {
      process.stderr.write(result.stderr)
    }

    throw new Error(`${command} ${args.join(' ')} failed.`)
  }

  return result
}

const runSupabase = (args, options = {}) => {
  return runCommand(
    npxCommand,
    ['--yes', `supabase@${supabaseVersion}`, ...args],
    options
  )
}

const stopSupabase = ({ allowFailure = false, quiet = false } = {}) => {
  const result = spawnSync(
    npxCommand,
    ['--yes', `supabase@${supabaseVersion}`, 'stop', '--no-backup'],
    {
      encoding: 'utf8'
    }
  )

  if (result.status !== 0) {
    if (!quiet && result.stdout) {
      process.stdout.write(result.stdout)
    }

    if (!quiet && result.stderr) {
      process.stderr.write(result.stderr)
    }

    if (!allowFailure) {
      throw new Error('Could not stop local Supabase.')
    }
  }

  return result.status === 0
}

const startSupabase = () => {
  stopSupabase({ allowFailure: true, quiet: true })

  try {
    runSupabase(['start'], { stdio: 'inherit' })
  } catch (error) {
    console.warn(
      'Supabase failed to start. Cleaning up partial containers and retrying once.'
    )
    stopSupabase({ allowFailure: true })
    runSupabase(['start'], { stdio: 'inherit' })
  }
}

const parseEnvironmentOutput = (output) => {
  return Object.fromEntries(
    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        const match = line.match(/^([A-Z0-9_]+)=(?:"([\s\S]*)"|([^\s]+))$/)

        if (!match) {
          return []
        }

        return [[match[1], match[2] ?? match[3] ?? '']]
      })
  )
}

const requireEnvironmentValue = (environment, ...keys) => {
  for (const key of keys) {
    const value = environment[key]

    if (value) {
      return value
    }
  }

  throw new Error(
    `Supabase local environment did not provide ${keys.join(' or ')}.`
  )
}

let supabaseLifecycleAttempted = false
let exitCode = 1

try {
  if (!existsSync('supabase/config.toml')) {
    runSupabase(['init'], { stdio: 'inherit' })
  }

  supabaseLifecycleAttempted = true
  startSupabase()

  const statusResult = runSupabase(['status', '-o', 'env'])
  const localEnvironment = parseEnvironmentOutput(statusResult.stdout)
  const apiUrl = requireEnvironmentValue(localEnvironment, 'API_URL')
  const publishableKey = requireEnvironmentValue(
    localEnvironment,
    'PUBLISHABLE_KEY',
    'ANON_KEY'
  )
  const secretKey = requireEnvironmentValue(
    localEnvironment,
    'SECRET_KEY',
    'SERVICE_ROLE_KEY'
  )

  const testEnvironment = {
    ...process.env,
    NUXT_TAG_DATA_SOURCE: 'supabase',
    NUXT_SUPABASE_URL: apiUrl,
    NUXT_PUBLIC_SUPABASE_ANON_KEY: publishableKey,
    NUXT_SUPABASE_SERVICE_ROLE_KEY: secretKey,
    NUXT_SUPABASE_STORAGE_BUCKET: 'bike_tag_photos',
    NUXT_SUPABASE_PENDING_STORAGE_BUCKET: 'bike_tag_pending_photos',
    NUXT_PUBLIC_SITE_URL: 'http://127.0.0.1:4174',
    WORKFLOW_SUPABASE_URL: apiUrl,
    WORKFLOW_SUPABASE_SERVICE_ROLE_KEY: secretKey,
    WORKFLOW_ADMIN_EMAIL: 'workflow-admin@example.com',
    WORKFLOW_ADMIN_PASSWORD: 'BikeTagWorkflow123!'
  }

  const testResult = spawnSync(
    npxCommand,
    ['playwright', 'test', '--config=playwright.workflow.config.ts'],
    {
      env: testEnvironment,
      stdio: 'inherit'
    }
  )

  exitCode = testResult.status ?? 1
} catch (error) {
  console.error(error)
  exitCode = 1
} finally {
  if (supabaseLifecycleAttempted) {
    try {
      stopSupabase()
    } catch (error) {
      console.error(error)
      exitCode = 1
    }
  }
}

process.exit(exitCode)
