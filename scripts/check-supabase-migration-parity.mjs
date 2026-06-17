import { readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { spawnSync } from 'node:child_process'

const migrationFilenamePattern = /^(\d+)_(.+)\.sql$/
const migrationQuery = `
select version, name
from supabase_migrations.schema_migrations
order by version;
`.trim()

const sortMigrations = (left, right) => {
  return (
    left.version.localeCompare(right.version) ||
    left.name.localeCompare(right.name)
  )
}

const assertUniqueVersions = (migrations, sourceLabel) => {
  const versions = new Set()

  for (const migration of migrations) {
    if (versions.has(migration.version)) {
      throw new Error(
        `${sourceLabel} contains duplicate migration version ${migration.version}.`
      )
    }

    versions.add(migration.version)
  }
}

const groupMigrationsByName = (migrations) => {
  const migrationsByName = new Map()

  for (const migration of migrations) {
    const matchingMigrations = migrationsByName.get(migration.name) || []

    matchingMigrations.push(migration)
    migrationsByName.set(migration.name, matchingMigrations)
  }

  return migrationsByName
}

export const loadLocalMigrations = (
  migrationsDirectory = resolve(process.cwd(), 'supabase/migrations')
) => {
  const migrations = readdirSync(migrationsDirectory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => {
      const match = entry.name.match(migrationFilenamePattern)

      if (!match) {
        throw new Error(
          `Migration filename must use <version>_<name>.sql: ${entry.name}`
        )
      }

      return {
        version: match[1],
        name: match[2],
        filename: entry.name
      }
    })
    .sort(sortMigrations)

  assertUniqueVersions(migrations, 'Repository migration directory')

  return migrations
}

export const parseRemoteMigrations = (output) => {
  const migrations = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.indexOf('\t')

      if (separatorIndex < 1) {
        throw new Error(`Could not parse hosted migration row: ${line}`)
      }

      const version = line.slice(0, separatorIndex).trim()
      const name = line.slice(separatorIndex + 1).trim()

      if (!/^\d+$/.test(version) || !name) {
        throw new Error(`Hosted migration row is invalid: ${line}`)
      }

      return { version, name }
    })
    .sort(sortMigrations)

  assertUniqueVersions(migrations, 'Hosted migration ledger')

  return migrations
}

export const compareMigrationSets = (localMigrations, remoteMigrations) => {
  const localByVersion = new Map(
    localMigrations.map((migration) => [migration.version, migration])
  )
  const remoteByVersion = new Map(
    remoteMigrations.map((migration) => [migration.version, migration])
  )
  const localByName = groupMigrationsByName(localMigrations)
  const remoteByName = groupMigrationsByName(remoteMigrations)

  const versionMismatches = localMigrations.flatMap((localMigration) => {
    const localNameMatches = localByName.get(localMigration.name) || []
    const remoteNameMatches = remoteByName.get(localMigration.name) || []

    if (localNameMatches.length !== 1 || remoteNameMatches.length !== 1) {
      return []
    }

    const remoteMigration = remoteNameMatches[0]

    if (remoteMigration.version === localMigration.version) {
      return []
    }

    return [
      {
        name: localMigration.name,
        localVersion: localMigration.version,
        remoteVersion: remoteMigration.version
      }
    ]
  })
  const mismatchedLocalVersions = new Set(
    versionMismatches.map((mismatch) => mismatch.localVersion)
  )
  const mismatchedRemoteVersions = new Set(
    versionMismatches.map((mismatch) => mismatch.remoteVersion)
  )

  const missingFromRemote = localMigrations.filter(
    (migration) =>
      !remoteByVersion.has(migration.version) &&
      !mismatchedLocalVersions.has(migration.version)
  )
  const unexpectedOnRemote = remoteMigrations.filter(
    (migration) =>
      !localByVersion.has(migration.version) &&
      !mismatchedRemoteVersions.has(migration.version)
  )
  const nameMismatches = localMigrations.flatMap((localMigration) => {
    const remoteMigration = remoteByVersion.get(localMigration.version)

    if (!remoteMigration || remoteMigration.name === localMigration.name) {
      return []
    }

    return [
      {
        version: localMigration.version,
        localName: localMigration.name,
        remoteName: remoteMigration.name
      }
    ]
  })

  return {
    matches:
      versionMismatches.length === 0 &&
      missingFromRemote.length === 0 &&
      unexpectedOnRemote.length === 0 &&
      nameMismatches.length === 0,
    versionMismatches,
    missingFromRemote,
    unexpectedOnRemote,
    nameMismatches
  }
}

const redactSecret = (value, secret) => {
  if (!value || !secret) {
    return value
  }

  return value.split(secret).join('[REDACTED]')
}

export const queryRemoteMigrations = ({
  databaseUrl = process.env.SUPABASE_DB_URL,
  psqlCommand = process.platform === 'win32' ? 'psql.exe' : 'psql',
  spawn = spawnSync
} = {}) => {
  const trimmedDatabaseUrl = databaseUrl?.trim()

  if (!trimmedDatabaseUrl) {
    throw new Error(
      'SUPABASE_DB_URL is required for the hosted migration parity check.'
    )
  }

  const { SUPABASE_DB_URL: _databaseUrl, ...baseEnvironment } = process.env

  const result = spawn(
    psqlCommand,
    [
      '--no-psqlrc',
      '--quiet',
      '--set=ON_ERROR_STOP=1',
      '--tuples-only',
      '--no-align',
      '--field-separator',
      '\t',
      '--dbname',
      trimmedDatabaseUrl,
      '--command',
      migrationQuery
    ],
    {
      encoding: 'utf8',
      env: {
        ...baseEnvironment,
        PGSSLMODE: process.env.PGSSLMODE || 'require'
      }
    }
  )

  if (result.error) {
    throw new Error(`Could not start ${psqlCommand}: ${result.error.message}`)
  }

  if (result.status !== 0) {
    const stderr = redactSecret(result.stderr?.trim(), trimmedDatabaseUrl)

    throw new Error(
      stderr
        ? `Could not read the hosted migration ledger: ${stderr}`
        : 'Could not read the hosted migration ledger.'
    )
  }

  return parseRemoteMigrations(result.stdout)
}

const formatMigration = (migration) => {
  return migration.filename || `${migration.version}_${migration.name}.sql`
}

const escapeAnnotation = (value) => {
  return value
    .replaceAll('%', '%25')
    .replaceAll('\r', '%0D')
    .replaceAll('\n', '%0A')
}

export const runMigrationParityCheck = ({
  environmentLabel = process.env.SUPABASE_ENVIRONMENT?.trim() || 'Hosted',
  localMigrations = loadLocalMigrations(),
  remoteMigrations = queryRemoteMigrations()
} = {}) => {
  const comparison = compareMigrationSets(localMigrations, remoteMigrations)

  console.log(
    `${environmentLabel} migration parity: ${localMigrations.length} local, ${remoteMigrations.length} hosted.`
  )

  if (comparison.matches) {
    console.log(
      `${environmentLabel} Supabase migration history matches the repository.`
    )
    return comparison
  }

  if (process.env.GITHUB_ACTIONS === 'true') {
    console.error(
      `::error title=Supabase migration parity failed::${escapeAnnotation(
        `${environmentLabel} migration history does not match supabase/migrations.`
      )}`
    )
  }

  if (comparison.versionMismatches.length) {
    console.error('\nMigration version mismatches:')
    for (const mismatch of comparison.versionMismatches) {
      console.error(
        `  - ${mismatch.name}: repository=${mismatch.localVersion}, hosted=${mismatch.remoteVersion}`
      )
    }
  }

  if (comparison.missingFromRemote.length) {
    console.error('\nMissing from hosted migration ledger:')
    for (const migration of comparison.missingFromRemote) {
      console.error(`  - ${formatMigration(migration)}`)
    }
  }

  if (comparison.unexpectedOnRemote.length) {
    console.error('\nUnexpected hosted migration records:')
    for (const migration of comparison.unexpectedOnRemote) {
      console.error(`  - ${formatMigration(migration)}`)
    }
  }

  if (comparison.nameMismatches.length) {
    console.error('\nMigration name mismatches:')
    for (const mismatch of comparison.nameMismatches) {
      console.error(
        `  - ${mismatch.version}: repository=${mismatch.localName}, hosted=${mismatch.remoteName}`
      )
    }
  }

  throw new Error(
    `${environmentLabel} Supabase migration history does not match the repository.`
  )
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href

if (isDirectExecution) {
  try {
    runMigrationParityCheck()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  }
}
