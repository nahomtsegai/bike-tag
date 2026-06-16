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

const requireEnvironmentValue = (environment, key) => {
  const value = environment[key]

  if (!value) {
    throw new Error(`Supabase local environment did not provide ${key}.`)
  }

  return value
}

let supabaseStarted = false
let exitCode = 1

try {
  if (!existsSync('supabase/config.toml')) {
    runSupabase(['init'], { stdio: 'inherit' })
  }

  runSupabase(['db', 'start'], { stdio: 'inherit' })
  supabaseStarted = true

  const statusResult = runSupabase(['status', '-o', 'env'])
  const localEnvironment = parseEnvironmentOutput(statusResult.stdout)
  const apiUrl = requireEnvironmentValue(localEnvironment, 'API_URL')
  const anonKey = requireEnvironmentValue(localEnvironment, 'ANON_KEY')
  const serviceRoleKey = requireEnvironmentValue(
    localEnvironment,
    'SERVICE_ROLE_KEY'
  )

  const testEnvironment = {
    ...process.env,
    NUXT_TAG_DATA_SOURCE: 'supabase',
    NUXT_SUPABASE_URL: apiUrl,
    NUXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
    NUXT_SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    NUXT_SUPABASE_STORAGE_BUCKET: 'bike_tag_photos',
    NUXT_SUPABASE_PENDING_STORAGE_BUCKET: 'bike_tag_pending_photos',
    NUXT_PUBLIC_SITE_URL: 'http://127.0.0.1:4174',
    WORKFLOW_SUPABASE_URL: apiUrl,
    WORKFLOW_SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
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
  if (supabaseStarted) {
    const stopResult = spawnSync(
      npxCommand,
      ['--yes', `supabase@${supabaseVersion}`, 'stop', '--no-backup'],
      {
        encoding: 'utf8'
      }
    )

    if (stopResult.status !== 0) {
      process.stderr.write(stopResult.stderr || 'Could not stop local Supabase.\n')
      exitCode = 1
    }
  }
}

process.exit(exitCode)
